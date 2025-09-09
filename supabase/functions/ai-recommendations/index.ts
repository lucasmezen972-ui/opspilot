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
    const { userId, userProfile, auditHistory, trainingHistory } = await req.json();

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
    En tant qu'expert en formation professionnelle et audit, analysez le profil suivant et générez 3 recommandations personnalisées :

    Profil utilisateur :
    - Rôle: ${userProfile.role}
    - Niveau: ${userProfile.level}
    - Score moyen: ${userProfile.avg_score}%
    - Audits réalisés: ${userProfile.total_audits}
    - Formations complétées: ${userProfile.completed_trainings}

    Historique des audits récents :
    ${auditHistory.map((a: any) => `- ${a.title}: ${a.score}/${a.max_score} (${a.status})`).join('\n')}

    Historique des formations :
    ${trainingHistory.map((t: any) => `- ${t.title}: ${t.status} (${t.difficulty})`).join('\n')}

    Générez 3 recommandations ACTIONABLES au format JSON :
    {
      "recommendations": [
        {
          "type": "training|competency|career_path",
          "title": "Titre clair de la recommandation",
          "description": "Description détaillée avec bénéfices concrets",
          "confidence_score": 0.85,
          "priority": "high|medium|low",
          "estimated_impact": "Description de l'impact attendu",
          "action_items": ["Action 1", "Action 2"],
          "deadline_days": 30
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
            content: 'Tu es un expert en formation professionnelle et audit. Réponds uniquement en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    let recommendations;
    try {
      recommendations = JSON.parse(aiResponse);
    } catch (e) {
      // Fallback si la réponse n'est pas du JSON valide
      recommendations = {
        recommendations: [
          {
            type: 'training',
            title: 'Formation recommandée par IA',
            description: aiResponse.substring(0, 200) + '...',
            confidence_score: 0.75,
            priority: 'medium',
            estimated_impact: 'Amélioration des performances',
            action_items: ['Suivre la formation', 'Pratiquer les concepts'],
            deadline_days: 30
          }
        ]
      };
    }

    return new Response(
      JSON.stringify(recommendations),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('AI recommendations error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI recommendations',
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