import { Card, Heading, Text, useTheme } from '@aws-amplify/ui-react';
import type { TTelemetryMessage } from '../../types/telemetry';

interface DataVisualizationProps {
  data: TTelemetryMessage | null;
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const { tokens } = useTheme();

  return (
    <Card
      variation="outlined"
      borderColor={tokens.colors.border.secondary}
      borderRadius={tokens.radii.large}
      padding={tokens.space.medium}
    >
      <Heading level={4}>pH Levels</Heading>
      <Text color={tokens.colors.font.secondary}>
        {data ? JSON.stringify(data, null, 2) : 'No data received'}
      </Text>
    </Card>
  );
} 