import React from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Grid } from '@astryxdesign/core/Grid';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Banner } from '@astryxdesign/core/Banner';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Icon } from '@astryxdesign/core/Icon';
import {
  detectActiveAllergy,
  evaluateBmi,
  evaluateVitalSign,
} from '@/features/nurse/utils/triage-helpers';

export interface NurseAssessmentData {
  id: number;
  weight_kg: number;
  height_cm: number;
  systolic: number;
  diastolic: number;
  pulse_rate: number;
  body_temp: number;
  respiratory_rate: number;
  chief_complaint: string;
  allergy_history: string;
  disease_history?: string;
  notes?: string;
}

export interface InitialAssessmentCardProps {
  assessment: NurseAssessmentData;
}

export const InitialAssessmentCard: React.FC<InitialAssessmentCardProps> = ({
  assessment,
}) => {
  const hasAllergy = detectActiveAllergy(assessment.allergy_history);
  const bmiResult = evaluateBmi(assessment.weight_kg, assessment.height_cm);

  const systolicEval = evaluateVitalSign('systolic', assessment.systolic);
  const diastolicEval = evaluateVitalSign('diastolic', assessment.diastolic);
  const pulseEval = evaluateVitalSign('pulse', assessment.pulse_rate);
  const tempEval = evaluateVitalSign('temp', assessment.body_temp);
  const respEval = evaluateVitalSign('respiratory', assessment.respiratory_rate);

  // Gabungkan status tekanan darah berdasarkan tingkat keparahan tertinggi
  const bpEval =
    systolicEval.severity === 'critical' || diastolicEval.severity === 'critical'
      ? systolicEval.severity === 'critical'
        ? systolicEval
        : diastolicEval
      : systolicEval.severity === 'warning' || diastolicEval.severity === 'warning'
        ? systolicEval.severity === 'warning'
          ? systolicEval
          : diastolicEval
        : systolicEval;

  const abnormalCount = [bpEval, pulseEval, tempEval, respEval].filter(
    (item) => item.severity !== 'normal'
  ).length;

  return (
    <VStack gap={3}>
      {/* Prioritas Keselamatan Tertinggi: Banner Alergi Aktif */}
      {hasAllergy ? (
        <Banner
          status="error"
          title="Peringatan Alergi Pasien (Wajib Diperhatikan Sebelum Resep)"
          description={assessment.allergy_history}
          collapsible={false}
        />
      ) : null}

      <Card padding={4} elevation="low">
        <VStack gap={3}>
          {/* Header Ringkasan Skrining */}
          <HStack justify="between" align="center" wrap="wrap" gap={2}>
            <HStack gap={2} align="center">
              <Icon icon="info" color="teal" size="md" />
              <Heading level={3}>Informasi Skrining Awal Nakes (Triage)</Heading>
            </HStack>

            <HStack gap={1.5} align="center" wrap="wrap">
              <Token
                size="sm"
                color={hasAllergy ? 'red' : 'green'}
                icon={<Icon icon={hasAllergy ? 'warning' : 'check'} size="xsm" />}
                label={hasAllergy ? 'Peringatan Alergi' : 'Alergi Negatif'}
              />
              <Token
                size="sm"
                color={abnormalCount > 0 ? 'orange' : 'teal'}
                icon={<Icon icon={abnormalCount > 0 ? 'warning' : 'check'} size="xsm" />}
                label={
                  abnormalCount > 0
                    ? `${abnormalCount} TTV Di Luar Normal`
                    : 'Seluruh TTV Normal'
                }
              />
            </HStack>
          </HStack>

          {/* Informasi Primer 1: Keluhan Utama Pasien */}
          <Section variant="muted" padding={3}>
            <VStack gap={1}>
              <Text type="supporting" weight="semibold">
                Keluhan Utama Pasien (Subjective)
              </Text>
              <Text weight="medium">
                {assessment.chief_complaint || 'Keluhan utama tidak tercatat.'}
              </Text>
            </VStack>
          </Section>

          {/* Informasi Primer 2: 4 Tanda-Tanda Vital Utama + Makna Non-Warna */}
          <Grid columns={{ minWidth: 155, max: 4 }} gap={2}>
            <Section variant="muted" padding={3}>
              <VStack gap={1}>
                <Text type="supporting">Tekanan Darah</Text>
                <HStack gap={1} align="center" wrap="wrap">
                  <Text type="large" weight="bold" hasTabularNumbers>
                    {assessment.systolic}/{assessment.diastolic}
                  </Text>
                  <Text type="supporting">mmHg</Text>
                </HStack>
                <HStack gap={1} align="center">
                  <StatusDot
                    variant={bpEval.statusVariant}
                    icon={<Icon icon={bpEval.iconName} size="xsm" />}
                    label={bpEval.shortLabel}
                  />
                  <Text type="supporting" weight="medium">
                    {bpEval.shortLabel}
                  </Text>
                </HStack>
              </VStack>
            </Section>

            <Section variant="muted" padding={3}>
              <VStack gap={1}>
                <Text type="supporting">Frekuensi Nadi</Text>
                <HStack gap={1} align="center" wrap="wrap">
                  <Text type="large" weight="bold" hasTabularNumbers>
                    {assessment.pulse_rate}
                  </Text>
                  <Text type="supporting">x/mnt</Text>
                </HStack>
                <HStack gap={1} align="center">
                  <StatusDot
                    variant={pulseEval.statusVariant}
                    icon={<Icon icon={pulseEval.iconName} size="xsm" />}
                    label={pulseEval.shortLabel}
                  />
                  <Text type="supporting" weight="medium">
                    {pulseEval.shortLabel}
                  </Text>
                </HStack>
              </VStack>
            </Section>

            <Section variant="muted" padding={3}>
              <VStack gap={1}>
                <Text type="supporting">Suhu Tubuh</Text>
                <HStack gap={1} align="center" wrap="wrap">
                  <Text type="large" weight="bold" hasTabularNumbers>
                    {assessment.body_temp}
                  </Text>
                  <Text type="supporting">°C</Text>
                </HStack>
                <HStack gap={1} align="center">
                  <StatusDot
                    variant={tempEval.statusVariant}
                    icon={<Icon icon={tempEval.iconName} size="xsm" />}
                    label={tempEval.shortLabel}
                  />
                  <Text type="supporting" weight="medium">
                    {tempEval.shortLabel}
                  </Text>
                </HStack>
              </VStack>
            </Section>

            <Section variant="muted" padding={3}>
              <VStack gap={1}>
                <Text type="supporting">Pernapasan (RR)</Text>
                <HStack gap={1} align="center" wrap="wrap">
                  <Text type="large" weight="bold" hasTabularNumbers>
                    {assessment.respiratory_rate}
                  </Text>
                  <Text type="supporting">x/mnt</Text>
                </HStack>
                <HStack gap={1} align="center">
                  <StatusDot
                    variant={respEval.statusVariant}
                    icon={<Icon icon={respEval.iconName} size="xsm" />}
                    label={respEval.shortLabel}
                  />
                  <Text type="supporting" weight="medium">
                    {respEval.shortLabel}
                  </Text>
                </HStack>
              </VStack>
            </Section>
          </Grid>

          <Divider />

          {/* Progressive Disclosure: Detail Sekunder Antropometri & Riwayat Tambahan */}
          <Collapsible
            defaultIsOpen={false}
            trigger={
              <HStack gap={2} align="center" wrap="wrap">
                <Text type="supporting" weight="semibold">
                  Detail Sekunder: Antropometri ({assessment.weight_kg} kg / {assessment.height_cm} cm • BMI {bmiResult.bmiFormatted})
                </Text>
                <Token
                  size="sm"
                  color={bmiResult.evaluation.tokenColor}
                  icon={<Icon icon={bmiResult.evaluation.iconName} size="xsm" />}
                  label={bmiResult.evaluation.shortLabel}
                />
                {assessment.disease_history || assessment.notes ? (
                  <Token
                    size="sm"
                    color="teal"
                    icon={<Icon icon="info" size="xsm" />}
                    label="Ada Catatan Riwayat"
                  />
                ) : null}
              </HStack>
            }
          >
            <VStack gap={2} paddingBlockStart={3}>
              <MetadataList columns="multi">
                <MetadataListItem label="Berat & Tinggi Badan">
                  <Text hasTabularNumbers>
                    {assessment.weight_kg} kg / {assessment.height_cm} cm
                  </Text>
                </MetadataListItem>
                <MetadataListItem label="Indeks Massa Tubuh (BMI)">
                  <Text hasTabularNumbers>
                    {bmiResult.bmiFormatted} kg/m² ({bmiResult.categoryLabel})
                  </Text>
                </MetadataListItem>
                {!hasAllergy ? (
                  <MetadataListItem label="Riwayat Alergi Tercatat">
                    <Text>
                      {assessment.allergy_history || 'Tidak ada riwayat alergi dilaporkan'}
                    </Text>
                  </MetadataListItem>
                ) : null}
                <MetadataListItem label="Riwayat Penyakit Terdahulu">
                  <Text>{assessment.disease_history || 'Tidak ada catatan'}</Text>
                </MetadataListItem>
                <MetadataListItem label="Catatan Khusus Perawat">
                  <Text>{assessment.notes || 'Tidak ada catatan tambahan'}</Text>
                </MetadataListItem>
              </MetadataList>
            </VStack>
          </Collapsible>
        </VStack>
      </Card>
    </VStack>
  );
};
