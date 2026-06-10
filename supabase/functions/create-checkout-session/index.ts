import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const tapSecretKey = Deno.env.get('TAP_SECRET_KEY');

    if (!tapSecretKey) {
      throw new Error('Tap Payments secret key not configured');
    }

    // Get authenticated user (REQUIRED)
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    // User must be logged in to purchase codes
    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in to purchase codes.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { productId, currency = 'SAR', quantity = 1 } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const safeQuantity = Math.max(1, Math.floor(quantity));

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (product.stock < safeQuantity) {
      return new Response(
        JSON.stringify({ error: `Only ${product.stock} item(s) available in stock` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there are enough available codes for this product
    const { data: availableCodes, error: codeError } = await supabase
      .from('codes')
      .select('id')
      .eq('product_id', productId)
      .eq('is_used', false)
      .limit(safeQuantity);

    if (codeError || !availableCodes || availableCodes.length < safeQuantity) {
      return new Response(
        JSON.stringify({ error: `Not enough codes available. Only ${availableCodes?.length || 0} code(s) in stock.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Currency conversion rates (USD base)
    const conversionRates: Record<string, number> = {
      'SAR': 3.75,
      'AED': 3.67,
      'EGP': 30.90,
      'GBP': 0.79,
      'EUR': 0.92,
      'USD': 1.00,
    };

    const unitPrice = product.price;
    const totalUSD = unitPrice * safeQuantity;
    const convertedAmount = totalUSD * (conversionRates[currency] || 1);
    const amountInMinorUnits = Math.round(convertedAmount * 1000);

    const origin = req.headers.get('origin') || 'https://yourdomain.com';

    // Create Tap Payments charge
    const tapResponse = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInMinorUnits,
        currency: currency,
        customer: {
          email: userEmail,
        },
        source: {
          id: 'src_all',
        },
        redirect: {
          url: `${origin}/payment/success`,
        },
        post: {
          url: `${supabaseUrl}/functions/v1/checkout-webhook`,
        },
        description: `Purchase: ${product.name_en} x${safeQuantity}`,
        reference: {
          transaction: `order_${userId}_${Date.now()}`,
          order: `${userId}_${productId}`,
        },
        metadata: {
          user_id: userId,
          product_id: productId,
          product_name: product.name_en,
          quantity: String(safeQuantity),
        },
      }),
    });

    if (!tapResponse.ok) {
      const errorData = await tapResponse.text();
      console.error('Tap Payments API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tapData = await tapResponse.json();

    // Create pending order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total: totalUSD,
        payment_gateway_id: tapData.id,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        payment_id: tapData.id,
        redirect_url: tapData.transaction?.url,
        order_id: order.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});