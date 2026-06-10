import { createClient } from "jsr:@supabase/supabase-js@2";

// Bawabah configuration
const BAWABAH_APP_ID = "mREft20T";
const BAWABAH_APP_SECRET = "3B3MZcdq31RTc82KA91ypB9m2l3SplTlffloMPApBpc";
const BAWABAH_API_URL = "https://bawabah.app/api";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId in query" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Capture user session from Bawabah
    const captureResponse = await fetch(`${BAWABAH_API_URL}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appId: BAWABAH_APP_ID,
        appSecret: BAWABAH_APP_SECRET,
        sessionId: sessionId,
      }),
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error("Bawabah capture error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to capture session from Bawabah",
          details: errorData,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const userData = await captureResponse.json();
    console.log("Bawabah user data:", userData);

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in Supabase
    const { data: existingUser } = await supabase
      .from("Users")
      .select("*")
      .eq("email", userData.email)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await supabase
        .from("Users")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", userId);
    } else {
      const { data: newUser, error: createError } = await supabase
        .from("Users")
        .insert({
          email: userData.email,
          name: userData.name || userData.email.split("@")[0],
          role: "user",
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      userId = newUser.id;

      await supabase.from("profiles").insert({
        user_id: userId,
        full_name: userData.name || userData.email.split("@")[0],
      });
    }

    return new Response(
      JSON.stringify({
        loggedIn: true,
        user: {
          id: userId,
          email: userData.email,
          name: userData.name,
          provider: userData.provider || "bawabah",
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Callback error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to process callback",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
