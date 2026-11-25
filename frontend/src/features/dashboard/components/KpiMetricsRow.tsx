import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Divider } from '@astryxdesign/core/Divider';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { formatCurrency } from '@/utils/formatters';

export interface KpiData {
  visits: {
    total_visits: number;
    general_visits: number;
    bpjs_visits: number;
    completed_visits: number;
  };
  revenue: {
    total_revenue: number | string;
    general_revenue: number | string;
    bpjs_covered_revenue: number | string;
  };
}

export interface KpiMetricsRowProps {
  data: KpiData | null;
  isLoading: boolean;
}

export const KpiMetricsRow: React.FC<KpiMetricsRowProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <Grid columns={{ minWidth: 210, max: 4 }} gap={4}>
        {[0, 1, 2, 3].map((idx) => (
          <Card key={idx} padding={4} elevation="low">
            <VStack gap={2}>
              <Skeleton height={16} width="55%" radius={2} index={idx} />
              <Skeleton height={32} width="75%" radius={2} index={idx} />
              <Skeleton height={14} width="90%" radius={2} index={idx} />
            </VStack>
          </Card>
        ))}
      </Grid>
    );
  }

  const visits = data.visits || {
    total_visits: 0,
    general_visits: 0,
    bpjs_visits: 0,
    completed_visits: 0,
  };

  const revenue = data.revenue || {
    total_revenue: 0,
    general_revenue: 0,
    bpjs_covered_revenue: 0,
  };

  const totalRev = Number(revenue.total_revenue) || 0;
  const generalRev = Number(revenue.general_revenue) || 0;
  const bpjsRev = Number(revenue.bpjs_covered_revenue) || 0;

  const completionRate =
    visits.total_visits > 0
      ? Math.round((visits.completed_visits / visits.total_visits) * 100)
      : 0;

  const bpjsPct =
    visits.total_visits > 0
      ? Math.round((visits.bpjs_visits / visits.total_visits) * 100)
      : 0;

  return (
    <Grid columns={{ minWidth: 210, max: 4 }} gap={4}>
      <Card padding={4} elevation="low">
        <VStack gap={2}>
          <Text type="supporting" weight="semibold">
            Total Kunjungan
          </Text>
          <Text type="large" weight="bold" hasTabularNumbers>
            {visits.total_visits}
          </Text>
          <Divider />
          <HStack justify="between" align="center" wrap="wrap" gap={2}>
            <Text color="secondary">{visits.bpjs_visits} Pasien BPJS</Text>
            <Text color="secondary">{visits.general_visits} Pasien Umum</Text>
          </HStack>
        </VStack>
      </Card>

      <Card padding={4} elevation="low">
        <VStack gap={2}>
          <Text type="supporting" weight="semibold">
            Total Pendapatan RS
          </Text>
          <Text type="large" weight="bold" hasTabularNumbers>
            {formatCurrency(totalRev)}
          </Text>
          <Divider />
          <HStack justify="between" align="center" wrap="wrap" gap={2}>
            <Text color="secondary">Tunai: {formatCurrency(generalRev)}</Text>
            <Text color="secondary">Klaim: {formatCurrency(bpjsRev)}</Text>
          </HStack>
        </VStack>
      </Card>

      <Card padding={4} elevation="low">
        <VStack gap={2}>
          <Text type="supporting" weight="semibold">
            Layanan Selesai
          </Text>
          <HStack gap={2} align="center">
            <Text type="large" weight="bold" hasTabularNumbers>
              {visits.completed_visits}
            </Text>
            <Token
              size="sm"
              color={completionRate >= 70 ? 'green' : 'teal'}
              label={`${completionRate}%`}
            />
          </HStack>
          <Divider />
          <Text color="secondary">
            Dari {visits.total_visits} kunjungan rawat jalan
          </Text>
        </VStack>
      </Card>

      <Card padding={4} elevation="low">
        <VStack gap={2}>
          <Text type="supporting" weight="semibold">
            Dominasi Penjamin
          </Text>
          <Text type="large" weight="bold">
            {visits.bpjs_visits >= visits.general_visits ? 'Peserta BPJS' : 'Pasien Umum'}
          </Text>
          <ProgressBar
            label="Porsi BPJS"
            value={visits.bpjs_visits}
            max={Math.max(1, visits.total_visits)}
            variant="success"
            hasValueLabel
            formatValueLabel={() => `${bpjsPct}% BPJS`}
          />
        </VStack>
      </Card>
    </Grid>
  );
};
