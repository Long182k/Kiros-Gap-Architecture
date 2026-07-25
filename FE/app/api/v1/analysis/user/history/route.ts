import { NextRequest, NextResponse } from 'next/server';
import { analysisStore } from '../../route';

export async function GET(req: NextRequest) {
  try {
    const list = Array.from(analysisStore.values());
    
    // Add a default sample history entry if list is empty
    if (list.length === 0) {
      list.push({
        id: 'sample-analysis-101',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        aiProcessingTimeMs: 1100,
        result: {
          missingSkills: ['Kubernetes', 'Kafka', 'OAuth2 / OIDC', 'Vector DB'],
          learningPath: [
            { step: 'Setup K8s cluster using minikube or k3s.', resource: 'https://kubernetes.io' }
          ],
          interviewQuestions: [
            'Describe your experience with microservices deployment.'
          ],
          status: 'COMPLETED'
        }
      });
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      analyses: list
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
  }
}
