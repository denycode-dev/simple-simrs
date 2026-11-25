import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';

export interface PolyclinicStat {
  polyclinic_name: string;
  visit_count: number;
}

export interface VisitsByPolyChartProps {
  data: PolyclinicStat[];
  isLoading: boolean;
}

export const VisitsByPolyChart: React.FC<VisitsByPolyChartProps> = ({
  data,
  isLoading,
}) => {
  const total = data.reduce((acc, curr) => acc + curr.visit_count, 0);

  return (
    <Card padding={0} elevation="low">
      <Section variant="transparent" padding={4} dividers={['bottom']}>
        <VStack gap={0.5}>
          <Heading level={3}>Kunjungan per Poliklinik</Heading>
          <Text color="secondary">Distribusi pasien rawat jalan antar poliklinik</Text>
        </VStack>
      </Section>

      <Section variant="transparent" padding={4}>
        {isLoading ? (
          <VStack gap={3}>
            <Skeleton height={28} radius={2} index={0} />
            <Skeleton height={28} radius={2} index={1} />
            <Skeleton height={28} radius={2} index={2} />
          </VStack>
        ) : data.length === 0 ? (
          <EmptyState
            isCompact
            headingLevel={4}
            icon={<Icon icon="info" size="md" color="teal" />}
            title="Belum Ada Data Poliklinik"
            description="Belum ada kunjungan tercatat pada periode ini."
          />
        ) : (
          <VStack gap={3}>
            {data.map((poly) => {
              const percentage =
                total > 0 ? Math.round((poly.visit_count / total) * 100) : 0;

              return (
                <VStack key={poly.polyclinic_name} gap={1}>
                  <HStack justify="between" align="center" gap={2}>
                    <Text weight="medium">{poly.polyclinic_name}</Text>
                    <Text color="secondary" hasTabularNumbers>
                      {poly.visit_count} pasien ({percentage}%)
                    </Text>
                  </HStack>
                  <ProgressBar
                    label={poly.polyclinic_name}
                    isLabelHidden
                    value={poly.visit_count}
                    max={Math.max(1, total)}
                    variant="accent"
                  />
                </VStack>
              );
            })}
          </VStack>
        )}
      </Section>
    </Card>
  );
};
