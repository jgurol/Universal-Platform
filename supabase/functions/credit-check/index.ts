import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreditCheckRequest {
  businessName: string;
}

interface CreditCheckResponse {
  creditScore: number;
  creditRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendation: string;
  reportDate: string;
  businessName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName }: CreditCheckRequest = await req.json();

    if (!businessName) {
      return new Response(
        JSON.stringify({ error: 'Business name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[CreditCheck] Processing credit check for: ${businessName}`);

    // For demo purposes, we'll simulate a credit check with realistic variations
    // In production, you would integrate with actual credit reporting services like:
    // - Experian Business Credit API
    // - Dun & Bradstreet API
    // - Equifax Business Credit API
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a simulated credit score based on business name characteristics
    const nameHash = businessName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseScore = 500 + (nameHash % 350); // Score between 500-850
    
    // Add some randomness while keeping it deterministic for the same name
    const variation = (nameHash % 100) - 50; // -50 to +50 variation
    const creditScore = Math.max(300, Math.min(850, baseScore + variation));

    const getCreditRating = (score: number): CreditCheckResponse['creditRating'] => {
      if (score >= 800) return 'Excellent';
      if (score >= 700) return 'Good';
      if (score >= 600) return 'Fair';
      if (score >= 500) return 'Poor';
      return 'Very Poor';
    };

    const getRiskLevel = (score: number): CreditCheckResponse['riskLevel'] => {
      if (score >= 700) return 'Low';
      if (score >= 600) return 'Medium';
      return 'High';
    };

    const getRecommendation = (score: number): string => {
      if (score >= 800) return 'Excellent credit - Approve with standard terms';
      if (score >= 700) return 'Good credit - Approve with standard terms';
      if (score >= 600) return 'Fair credit - Consider requiring deposit or shorter terms';
      if (score >= 500) return 'Poor credit - Require deposit and shorter payment terms';
      return 'Very poor credit - Consider declining or require significant deposit';
    };

    const creditRating = getCreditRating(creditScore);
    const riskLevel = getRiskLevel(creditScore);
    const recommendation = getRecommendation(creditScore);

    const response: CreditCheckResponse = {
      creditScore,
      creditRating,
      riskLevel,
      recommendation,
      reportDate: new Date().toISOString(),
      businessName
    };

    console.log(`[CreditCheck] Result for ${businessName}: Score ${creditScore}, Rating ${creditRating}`);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CreditCheck] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during credit check' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
