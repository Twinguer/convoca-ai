/**
 * Script de teste de performance para o módulo de ranking
 * Valida as otimizações implementadas na Fase 1
 */

import { fetchUserRankings } from '@/services/rankingService';
import { logger } from '@/utils/logger';

interface PerformanceTestResult {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  dataCount?: number;
}

export class RankingPerformanceTest {
  private results: PerformanceTestResult[] = [];

  async runAllTests(concursoId: string): Promise<PerformanceTestResult[]> {
    logger.info('Iniciando testes de performance do ranking', 'PERFORMANCE_TEST');
    
    // Teste 1: Query básica
    await this.testBasicQuery(concursoId);
    
    // Teste 2: Query com paginação
    await this.testPaginationQuery(concursoId);
    
    // Teste 3: Query com filtro de reserva
    await this.testReservationFilter(concursoId);
    
    // Teste 4: Múltiplas queries sequenciais
    await this.testMultipleQueries(concursoId);
    
    logger.info('Testes de performance concluídos', 'PERFORMANCE_TEST', {
      totalTests: this.results.length,
      successCount: this.results.filter(r => r.success).length,
      averageDuration: this.getAverageDuration()
    });
    
    return this.results;
  }

  private async testBasicQuery(concursoId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const rankings = await fetchUserRankings(concursoId);
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Query Básica',
        duration,
        success: true,
        dataCount: rankings.length
      });
      
      logger.performance('Basic Query Test', duration, 'PERFORMANCE_TEST');
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Query Básica',
        duration,
        success: false,
        error: String(error)
      });
    }
  }

  private async testPaginationQuery(concursoId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Testar primeira página
      const page1 = await fetchUserRankings(concursoId, undefined, 0, 10);
      
      // Testar segunda página
      const page2 = await fetchUserRankings(concursoId, undefined, 10, 10);
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Query com Paginação',
        duration,
        success: true,
        dataCount: page1.length + page2.length
      });
      
      logger.performance('Pagination Query Test', duration, 'PERFORMANCE_TEST');
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Query com Paginação',
        duration,
        success: false,
        error: String(error)
      });
    }
  }

  private async testReservationFilter(concursoId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const rankings = await fetchUserRankings(concursoId, 'Ampla Concorrência');
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Query com Filtro de Reserva',
        duration,
        success: true,
        dataCount: rankings.length
      });
      
      logger.performance('Reservation Filter Test', duration, 'PERFORMANCE_TEST');
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Query com Filtro de Reserva',
        duration,
        success: false,
        error: String(error)
      });
    }
  }

  private async testMultipleQueries(concursoId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Executar 5 queries sequenciais para simular uso real
      const promises = Array.from({ length: 5 }, (_, i) => 
        fetchUserRankings(concursoId, undefined, i * 10, 10)
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      const totalData = results.reduce((sum, rankings) => sum + rankings.length, 0);
      
      this.results.push({
        testName: 'Múltiplas Queries Sequenciais',
        duration,
        success: true,
        dataCount: totalData
      });
      
      logger.performance('Multiple Queries Test', duration, 'PERFORMANCE_TEST');
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Múltiplas Queries Sequenciais',
        duration,
        success: false,
        error: String(error)
      });
    }
  }

  private getAverageDuration(): number {
    const successfulTests = this.results.filter(r => r.success);
    if (successfulTests.length === 0) return 0;
    
    const totalDuration = successfulTests.reduce((sum, test) => sum + test.duration, 0);
    return totalDuration / successfulTests.length;
  }

  getResults(): PerformanceTestResult[] {
    return this.results;
  }

  getSummary(): {
    totalTests: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    fastestTest: PerformanceTestResult | null;
    slowestTest: PerformanceTestResult | null;
  } {
    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);
    
    const fastestTest = successfulTests.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest, 
      successfulTests[0] || null
    );
    
    const slowestTest = successfulTests.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest, 
      successfulTests[0] || null
    );
    
    return {
      totalTests: this.results.length,
      successCount: successfulTests.length,
      failureCount: failedTests.length,
      averageDuration: this.getAverageDuration(),
      fastestTest,
      slowestTest
    };
  }
}

// Função utilitária para executar testes rapidamente
export const runRankingPerformanceTest = async (concursoId: string): Promise<void> => {
  const tester = new RankingPerformanceTest();
  const results = await tester.runAllTests(concursoId);
  const summary = tester.getSummary();
  
  console.log('📊 RESULTADOS DOS TESTES DE PERFORMANCE:');
  console.log('=====================================');
  console.log(`Total de testes: ${summary.totalTests}`);
  console.log(`Sucessos: ${summary.successCount}`);
  console.log(`Falhas: ${summary.failureCount}`);
  console.log(`Duração média: ${summary.averageDuration.toFixed(2)}ms`);
  
  if (summary.fastestTest) {
    console.log(`Teste mais rápido: ${summary.fastestTest.testName} (${summary.fastestTest.duration.toFixed(2)}ms)`);
  }
  
  if (summary.slowestTest) {
    console.log(`Teste mais lento: ${summary.slowestTest.testName} (${summary.slowestTest.duration.toFixed(2)}ms)`);
  }
  
  console.log('\n📋 DETALHES DOS TESTES:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.testName}: ${result.duration.toFixed(2)}ms`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
    if (result.dataCount !== undefined) {
      console.log(`   Dados carregados: ${result.dataCount}`);
    }
  });
};
