import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tap-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const tapSecretKey = Deno.env.get('TAP_SECRET_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('x-tap-signature');

    // Verify Tap webhook signature
    if (signature && tapSecretKey) {
      const hmac = createHmac('sha256', tapSecretKey);
      hmac.update(body);
      const calculatedSignature = hmac.digest('hex');

      if (signature !== calculatedSignature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log('Tap webhook event received:', event);

    const chargeId = event.id;
    const status = event.status;
    const metadata = event.metadata || {};

    // Find the order by Tap charge ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_gateway_id', chargeId)
      .maybeSingle();

    if (orderError || !order) {
      console.error('Order not found for charge:', chargeId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle CAPTURED status (successful payment)
    if (status === 'CAPTURED') {
      const productId = metadata.product_id;
      const quantity = parseInt(metadata.quantity || '1', 10);

      if (!productId) {
        console.error('Product ID not found in metadata');
        return new Response(
          JSON.stringify({ error: 'Product ID missing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign codes to user (one by one for the quantity)
      const assignedCodes = [];
      for (let i = 0; i < quantity; i++) {
        const { data: assignedCode, error: assignError } = await supabase
          .rpc('assign_code_to_user', {
            p_product_id: productId,
            p_user_id: order.user_id,
            p_order_id: order.id
          })
          .maybeSingle();

        if (assignError || !assignedCode) {
          console.error(`Failed to assign code ${i + 1}/${quantity}:`, assignError);
          
          // Update order status to failed
          await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('id', order.id);

          return new Response(
            JSON.stringify({ error: `Failed to assign code ${i + 1}/${quantity} - out of stock` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        assignedCodes.push(assignedCode);

        // Create order item linking order to product and code
        const { error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: productId,
            code_id: assignedCode.code_id,
            quantity: 1,
            price_paid: order.total / quantity,
          });

        if (orderItemError) {
          console.error('Failed to create order item:', orderItemError);
        }
      }

      // Update order status to completed
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error('Failed to update order status:', updateOrderError);
      }

      console.log(`✅ Payment processed successfully for order: ${order.id}`);
      console.log(`✅ ${assignedCodes.length} code(s) assigned`);
    }
    // Handle FAILED status
    else if (status === 'FAILED') {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);

      console.log('❌ Payment failed for order:', order.id);
    }
    // Handle CANCELLED status
    else if (status === 'CANCELLED') {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      console.log('🚫 Payment cancelled for order:', order.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});