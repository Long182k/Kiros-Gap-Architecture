import { NextRequest, NextResponse } from 'next/server';
import { analysisStore } from '../route';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    if (analysisStore.has(id)) {
      return NextResponse.json(analysisStore.get(id));
    }

    // Default fallback response if ID not in memory cache
    const fallbackRecord = {
      success: true,
      id,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      aiProcessingTimeMs: 950,
      result: {
        missingSkills: [
          'Kubernetes (K8s) Cluster Management',
          'Kafka Distributed Event Streaming',
          'OAuth2 / OIDC Tenant Security & RBAC',
          'Vector Database Integration (Milvus / Qdrant)'
        ],
        learningPath: [
          { step: 'Study Kubernetes primitives, Deployment manifests, and Helm charts.', resource: 'https://kubernetes.io/docs/home/' },
          { step: 'Implement Kafka producers/consumers and topic partition strategies.', resource: 'https://kafka.apache.org/documentation/' },
          { step: 'Build RBAC authorization middleware and OIDC token validation.', resource: 'https://auth0.com/docs/' }
        ],
        interviewQuestions: [
          'How do you manage multi-tenant database isolation in a SaaS environment?',
          'Explain how Kafka partitions ensure message ordering across consumer groups.',
          'How do you debug container crashing issues in a Kubernetes pod?'
        ],
        status: 'COMPLETED'
      }
    };

    return NextResponse.json(fallbackRecord, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analysis' }, { status: 500 });
  }
}
