const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { organizationId, auditData, riskAssessments } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = `
    En tant qu'expert en audit et gestion des risques, analysez les données suivantes et générez des insights prédictifs :

    Données d'audit récentes :
    ${auditData.map((a: any) => `- ${a.title}: Score ${a.score}/${a.max_score}, ${a.issues_count} problèmes, Statut: ${a.status}`).join('\n')}

    Évaluations de risque :
    ${riskAssessments.map((r: any) => `- Catégorie: ${r.risk_category}, Score: ${r.risk_score}, Probabilité: ${r.probability}`).join('\n')}

    Générez des insights au format JSON :
    {
      "insights": [
        {
          "type": "risk_prediction|compliance_alert|performance_trend|resource_optimization",
          "title": "Titre de l'insight",
          "description": "Description détaillée du problème ou opportunité",
          "confidence_level": 0.87,
          "severity": "low|medium|high|critical",
          "predicted_impact": "Description de l'impact si aucune action",
          "recommended_actions": ["Action 1", "Action 2", "Action 3"],
          "timeline": "immediate|short_term|long_term",
          "affected_areas": ["Zone 1", "Zone 2"],
          "kpis_impact": {
            "compliance_score": "+5%",
            "efficiency": "+12%",
            "risk_reduction": "15%"
          }
        }
      ]
    }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en audit et conformité. Tu génères des insights prédictifs basés sur les données. Réponds uniquement en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    let insights;
    try {
      insights = JSON.parse(aiResponse);
    } catch (e) {
      insights = {
        insights: [
          {
            type: 'performance_trend',
            title: 'Analyse IA générée',
            description: aiResponse.substring(0, 300),
            confidence_level: 0.75,
            severity: 'medium',
            predicted_impact: 'Impact à analyser',
            recommended_actions: ['Analyser les résultats', 'Prendre des actions correctives'],
            timeline: 'short_term',
            affected_areas: ['Général'],
            kpis_impact: {
              compliance_score: '+5%',
              efficiency: '+10%'
            }
          }
        ]
      };
    }

    return new Response(
      JSON.stringify(insights),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('AI audit insights error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI insights',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});