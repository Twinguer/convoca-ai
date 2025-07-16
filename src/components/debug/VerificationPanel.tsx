import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVerifyAnswerFlow } from '@/hooks/useVerifyAnswerFlow';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VerificationPanelProps {
  concursoId: string;
  rankingId: string;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  concursoId,
  rankingId
}) => {
  const { verificationResults, isVerifying, verifyFlow, clearResults } = useVerifyAnswerFlow(
    concursoId,
    rankingId
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Verificação do Fluxo de Respostas
          <div className="flex gap-2">
            <Button
              onClick={verifyFlow}
              disabled={isVerifying}
              variant="default"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Executar Verificação'
              )}
            </Button>
            {verificationResults.length > 0 && (
              <Button onClick={clearResults} variant="outline">
                Limpar Resultados
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verificationResults.length > 0 && (
          <div className="space-y-4">
            {verificationResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.step}</span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? 'Sucesso' : 'Erro'}
                  </Badge>
                </div>
                
                {result.error && (
                  <p className="text-red-600 text-sm mb-2">{result.error}</p>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Ver dados
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
        
        {verificationResults.length === 0 && !isVerifying && (
          <div className="text-center text-gray-500 py-8">
            Clique em "Executar Verificação" para testar o fluxo completo de salvamento e recuperação de respostas.
          </div>
        )}
      </CardContent>
    </Card>
  );
};