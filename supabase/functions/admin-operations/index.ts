import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('x-admin-token');
    const expectedToken = Deno.env.get('ADMIN_SECRET_TOKEN') || 'admin-secret-2024';
    if (adminToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    // ── CREATE PRODUCT + CODES ──────────────────────────────────────────────
    if (action === 'create_product') {
      const { name_en, name_ar, description_en, description_ar, price, image_url, codes } = body;

      const codeCount = Array.isArray(codes) ? codes.length : 0;

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name_en,
          name_ar,
          description_en,
          description_ar,
          price,
          image_url,
          stock: codeCount,
        })
        .select()
        .single();

      if (productError) {
        return new Response(JSON.stringify({ error: productError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (codeCount > 0) {
        const codesToInsert = codes.map((code: string) => ({
          code,
          product_id: product.id,
          is_used: false,
        }));

        const { error: codesError } = await supabase.from('codes').insert(codesToInsert);

        if (codesError) {
          await supabase.from('products').delete().eq('id', product.id);
          return new Response(JSON.stringify({ error: codesError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, product }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ADD CODES TO EXISTING PRODUCT ───────────────────────────────────────
    if (action === 'add_codes') {
      const { product_id, codes } = body;

      if (!product_id) {
        return new Response(JSON.stringify({ error: 'product_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return new Response(JSON.stringify({ error: 'No codes provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const codesToInsert = codes.map((code: string) => ({
        code,
        product_id,
        is_used: false,
      }));

      const { error: codesError } = await supabase.from('codes').insert(codesToInsert);

      if (codesError) {
        return new Response(JSON.stringify({ error: codesError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update product stock count
      const { data: countData } = await supabase
        .from('codes')
        .select('id', { count: 'exact' })
        .eq('product_id', product_id)
        .eq('is_used', false);

      const newStock = countData?.length ?? codes.length;
      await supabase.from('products').update({ stock: newStock }).eq('id', product_id);

      return new Response(JSON.stringify({ success: true, added: codes.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE PRODUCT ──────────────────────────────────────────────────────
    if (action === 'update_product') {
      const { product_id, name_en, name_ar, description_en, description_ar, price, image_url, new_codes } = body;

      const updates: Record<string, unknown> = {};
      if (name_en !== undefined) updates.name_en = name_en;
      if (name_ar !== undefined) updates.name_ar = name_ar;
      if (description_en !== undefined) updates.description_en = description_en;
      if (description_ar !== undefined) updates.description_ar = description_ar;
      if (price !== undefined) updates.price = price;
      if (image_url !== undefined) updates.image_url = image_url;

      const { data: product, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product_id)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new_codes && Array.isArray(new_codes) && new_codes.length > 0) {
        const codesToInsert = new_codes.map((code: string) => ({
          code,
          product_id,
          is_used: false,
        }));

        const { error: codesError } = await supabase.from('codes').insert(codesToInsert);

        if (codesError) {
          return new Response(JSON.stringify({ error: codesError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update stock after adding new codes
        const { data: countData } = await supabase
          .from('codes')
          .select('id', { count: 'exact' })
          .eq('product_id', product_id)
          .eq('is_used', false);

        const newStock = countData?.length ?? new_codes.length;
        await supabase.from('products').update({ stock: newStock }).eq('id', product_id);
      }

      return new Response(JSON.stringify({ success: true, product }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE CODE ─────────────────────────────────────────────────────────
    if (action === 'delete_code') {
      const { code_id } = body;

      // Get product_id before deleting
      const { data: codeData } = await supabase
        .from('codes')
        .select('product_id')
        .eq('id', code_id)
        .maybeSingle();

      const { error } = await supabase.from('codes').delete().eq('id', code_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update product stock
      if (codeData?.product_id) {
        const { data: countData } = await supabase
          .from('codes')
          .select('id', { count: 'exact' })
          .eq('product_id', codeData.product_id)
          .eq('is_used', false);

        const newStock = countData?.length ?? 0;
        await supabase.from('products').update({ stock: newStock }).eq('id', codeData.product_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE PRODUCT ──────────────────────────────────────────────────────
    if (action === 'delete_product') {
      const { product_id } = body;
      await supabase.from('codes').delete().eq('product_id', product_id);
      const { error } = await supabase.from('products').delete().eq('id', product_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPLOAD IMAGE (base64) ───────────────────────────────────────────────
    if (action === 'upload_image') {
      const { base64, fileName, mimeType } = body;
      const byteString = atob(base64);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
      }
      const filePath = `products/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, bytes, { contentType: mimeType, upsert: false });

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return new Response(JSON.stringify({ success: true, url: data.publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
