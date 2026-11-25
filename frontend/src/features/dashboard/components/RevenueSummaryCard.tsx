import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { formatCurrency } from '@/utils/formatters';

export interface RevenueData {
  total_revenue: number | string;
  general_revenue: number | string;
  bpjs_covered_revenue: number | string;
}

export interface RevenueSummaryCardProps {
  data: RevenueData;
  isLoading: boolean;
}

export const RevenueSummaryCard: React.FC<RevenueSummaryCardProps> = ({
  data,
  isLoading,
}) => {
  const total = Number(data?.total_revenue) || 0;
  const general = Number(data?.general_revenue) || 0;
  const bpjs = Number(data?.bpjs_covered_revenue) || 0;

  const generalPct = total > 0 ? Math.round((general / total) * 100) : 0;
  const bpjsPct = total > 0 ? Math.round((bpjs / total) * 100) : 0;

  return (
    <Card padding={0} elevation="low">
      <Section variant="transparent" padding={4} dividers={['bottom']}>
        <VStack gap={0.5}>
          <Heading level={3}>Komposisi Sumber Pendapatan</Heading>
          <Text color="secondary">Penerimaan tunai pasien umum vs klaim BPJS</Text>
        </VStack>
      </Section>

      <Section variant="transparent" padding={4}>
        {isLoading ? (
          <VStack gap={3}>
            <Skeleton height={56} radius={2} index={0} />
            <Skeleton height={28} radius={2} index={1} />
            <Skeleton height={28} radius={2} index={2} />
          </VStack>
        ) : (
          <VStack gap={4}>
            <Section variant="muted" padding={3}>
              <VStack gap={0.5}>
                <Text type="supporting" weight="medium">
                  Total Akumulasi Tagihan Lunas
                </Text>
                <Text type="large" weight="bold" hasTabularNumbers>
                  {formatCurrency(total)}
                </Text>
              </VStack>
            </Section>

            <VStack gap={3}>
              <VStack gap={1}>
                <HStack justify="between" align="center" gap={2}>
                  <Text weight="medium">Kas Tunai Pasien Umum</Text>
                  <Text color="secondary" hasTabularNumbers>
                    {formatCurrency(general)} ({generalPct}%)
                  </Text>
                </HStack>
                <ProgressBar
                  label="Kas Tunai Pasien Umum"
                  isLabelHidden
                  value={general}
                  max={Math.max(1, total)}
                  variant="accent"
                />
              </VStack>

              <VStack gap={1}>
                <HStack justify="between" align="center" gap={2}>
                  <Text weight="medium">Klaim BPJS Kesehatan</Text>
                  <Text color="secondary" hasTabularNumbers>
                    {formatCurrency(bpjs)} ({bpjsPct}%)
                  </Text>
                </HStack>
                <ProgressBar
                  label="Klaim BPJS Kesehatan"
                  isLabelHidden
                  value={bpjs}
                  max={Math.max(1, total)}
                  variant="success"
                />
              </VStack>
            </VStack>
          </VStack>
        )}
      </Section>
    </Card>
  );
};
