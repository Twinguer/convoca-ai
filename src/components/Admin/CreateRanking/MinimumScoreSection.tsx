
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export const MinimumScoreSection = ({ form }: { form: UseFormReturn<any> }) => {
  const hasMinimumScore = form.watch('has_minimum_score');
  const minimumScoreType = form.watch('minimum_score_type');
  const minimumScoreUnitType = form.watch('minimum_score_unit_type');
  const hasQuotaMinimumScore = form.watch('has_quota_minimum_score');
  const quotaMinimumScoreUnitType = form.watch('quota_minimum_score_unit_type');
  const disciplines = form.watch('disciplines') || [];

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-medium">Pontuação Mínima</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-6">
          {/* Toggle para ativar pontuação mínima */}
          <FormField
            control={form.control}
            name="has_minimum_score"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Exigir pontuação mínima
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Candidatos devem atingir uma pontuação mínima para serem classificados
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Configurações de pontuação mínima */}
          {hasMinimumScore && (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Tipo de pontuação mínima */}
                <FormField
                  control={form.control}
                  name="minimum_score_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de pontuação mínima</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "total"}
                        value={field.value || "total"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="total">Por Total da Prova</SelectItem>
                          <SelectItem value="knowledge">Por Disciplina</SelectItem>
                          <SelectItem value="both">Ambas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Escolha como os candidatos serão avaliados
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Tipo de unidade para pontuação mínima */}
                <FormField
                  control={form.control}
                  name="minimum_score_unit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de pontuação mínima</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "absolute"}
                        value={field.value || "absolute"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="absolute">Valor Absoluto</SelectItem>
                          <SelectItem value="percentage">Porcentagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Pontuação mínima total para ampla concorrência */}
                {(minimumScoreType === 'total' || minimumScoreType === 'both') && (
                  <FormField
                    control={form.control}
                    name="total_ampla_minimum_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pontuação mínima para Ampla Concorrência</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseFloat(value))}
                          defaultValue={field.value?.toString() || "0"}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a pontuação mínima" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {minimumScoreUnitType === 'percentage' ? (
                              <>
                                <SelectItem value="0">Sem mínimo</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="20">20%</SelectItem>
                                <SelectItem value="30">30%</SelectItem>
                                <SelectItem value="40">40%</SelectItem>
                                <SelectItem value="50">50%</SelectItem>
                                <SelectItem value="60">60%</SelectItem>
                                <SelectItem value="70">70%</SelectItem>
                                <SelectItem value="80">80%</SelectItem>
                                <SelectItem value="90">90%</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="0">Sem mínimo</SelectItem>
                                <SelectItem value="1">1 ponto</SelectItem>
                                <SelectItem value="2">2 pontos</SelectItem>
                                <SelectItem value="3">3 pontos</SelectItem>
                                <SelectItem value="5">5 pontos</SelectItem>
                                <SelectItem value="10">10 pontos</SelectItem>
                                <SelectItem value="15">15 pontos</SelectItem>
                                <SelectItem value="20">20 pontos</SelectItem>
                                <SelectItem value="25">25 pontos</SelectItem>
                                <SelectItem value="30">30 pontos</SelectItem>
                                <SelectItem value="40">40 pontos</SelectItem>
                                <SelectItem value="50">50 pontos</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {minimumScoreUnitType === 'percentage' 
                            ? 'Porcentagem do total possível' 
                            : 'Valor absoluto de pontos'}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                {/* Pontuação mínima para cada disciplina */}
                {(minimumScoreType === 'knowledge' || minimumScoreType === 'both') && 
                 disciplines && disciplines.length > 0 && (
                  <div className="space-y-4">
                    <FormLabel>Pontuação mínima por disciplina</FormLabel>
                    {disciplines.filter(d => d.isEnabled).map((discipline, index) => (
                      <div key={discipline.type} className="grid grid-cols-2 gap-4 items-center">
                        <div className="text-sm font-medium">{discipline.name}</div>
                        <FormField
                          control={form.control}
                          name={`disciplines.${index}.minimumScore`}
                          render={({ field }) => (
                            <Select
                              onValueChange={(value) => field.onChange(parseFloat(value))}
                              defaultValue={field.value?.toString() || "0"}
                              value={field.value?.toString() || "0"}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pontuação mínima" />
                              </SelectTrigger>
                              <SelectContent>
                                {minimumScoreUnitType === 'percentage' ? (
                                  <>
                                    <SelectItem value="0">Sem mínimo</SelectItem>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="20">20%</SelectItem>
                                    <SelectItem value="30">30%</SelectItem>
                                    <SelectItem value="40">40%</SelectItem>
                                    <SelectItem value="50">50%</SelectItem>
                                    <SelectItem value="60">60%</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="0">Sem mínimo</SelectItem>
                                    <SelectItem value="1">1 ponto</SelectItem>
                                    <SelectItem value="2">2 pontos</SelectItem>
                                    <SelectItem value="3">3 pontos</SelectItem>
                                    <SelectItem value="5">5 pontos</SelectItem>
                                    <SelectItem value="10">10 pontos</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    ))}
                    <FormDescription>
                      {minimumScoreUnitType === 'percentage' 
                        ? 'Porcentagem do total possível para cada disciplina' 
                        : 'Valor absoluto de pontos para cada disciplina'}
                    </FormDescription>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pontuações mínimas para cotas */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="has_quota_minimum_score"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Pontuação mínima diferente para cotas
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Define uma pontuação mínima específica para candidatos cotistas
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {hasQuotaMinimumScore && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="quota_minimum_score_unit_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade de pontuação para cotas</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "percentage"}
                            value={field.value || "percentage"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="absolute">Valor Absoluto</SelectItem>
                              <SelectItem value="percentage">Porcentagem</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quota_minimum_score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pontuação mínima para cotistas</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseFloat(value))}
                            defaultValue={field.value?.toString() || "0"}
                            value={field.value?.toString() || "0"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a pontuação mínima" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {quotaMinimumScoreUnitType === 'percentage' ? (
                                <>
                                  <SelectItem value="0">Sem mínimo</SelectItem>
                                  <SelectItem value="10">10%</SelectItem>
                                  <SelectItem value="20">20%</SelectItem>
                                  <SelectItem value="30">30%</SelectItem>
                                  <SelectItem value="40">40%</SelectItem>
                                  <SelectItem value="50">50%</SelectItem>
                                  <SelectItem value="60">60%</SelectItem>
                                  <SelectItem value="70">70%</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="0">Sem mínimo</SelectItem>
                                  <SelectItem value="1">1 ponto</SelectItem>
                                  <SelectItem value="2">2 pontos</SelectItem>
                                  <SelectItem value="3">3 pontos</SelectItem>
                                  <SelectItem value="5">5 pontos</SelectItem>
                                  <SelectItem value="10">10 pontos</SelectItem>
                                  <SelectItem value="15">15 pontos</SelectItem>
                                  <SelectItem value="20">20 pontos</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {quotaMinimumScoreUnitType === 'percentage' 
                              ? 'Porcentagem do total possível' 
                              : 'Valor absoluto de pontos'}
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
