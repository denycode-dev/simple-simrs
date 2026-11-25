import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@astryxdesign/core/Table';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';

export interface TopMedicineItem {
  medicine_name: string;
  unit: string;
  total_prescribed: number;
}

export interface TopMedicinesTableProps {
  data: TopMedicineItem[];
  isLoading: boolean;
}

export const TopMedicinesTable: React.FC<TopMedicinesTableProps> = ({
  data,
  isLoading,
}) => {
  return (
    <Card elevation="low" padding={0}>
      <Section variant="transparent" padding={4} dividers={['bottom']}>
        <VStack gap={0.5}>
          <Heading level={3}>5 Obat Paling Banyak Diresepkan</Heading>
          <Text color="secondary">Monitoring pemakaian obat rawat jalan</Text>
        </VStack>
      </Section>

      {isLoading ? (
        <VStack gap={2} padding={4}>
          <Skeleton height={32} radius={2} index={0} />
          <Skeleton height={36} radius={2} index={1} />
          <Skeleton height={36} radius={2} index={2} />
        </VStack>
      ) : data.length === 0 ? (
        <Section variant="transparent" padding={5}>
          <EmptyState
            headingLevel={4}
            icon={<Icon icon="info" size="md" color="teal" />}
            title="Belum Ada Resep Obat"
            description="Tidak ada resep obat farmasi yang tercatat pada periode ini."
            isCompact
          />
        </Section>
      ) : (
        <Table density="balanced" dividers="rows" hasHover>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Nama Obat</TableHeaderCell>
              <TableHeaderCell>Satuan</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>
                Total Diresepkan
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((med, idx) => (
              <TableRow key={`${med.medicine_name}-${idx}`}>
                <TableCell>
                  <Text weight="semibold">{med.medicine_name}</Text>
                </TableCell>
                <TableCell>
                  <Text color="secondary">{med.unit}</Text>
                </TableCell>
                <TableCell>
                  <HStack justify="end">
                    <Code>{med.total_prescribed}</Code>
                  </HStack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};
