import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InitialAssessmentCard } from './components/InitialAssessmentCard';

describe('InitialAssessmentCard', () => {
  it('renders nurse initial assessment summary with vital signs and allergy alert', () => {
    const mockAssessment = {
      id: 1,
      weight_kg: 68,
      height_cm: 170,
      systolic: 130,
      diastolic: 85,
      pulse_rate: 82,
      body_temp: 36.8,
      respiratory_rate: 19,
      chief_complaint: 'Pusing dan leher kaku sejak pagi',
      allergy_history: 'Alergi Penisilin dan Seafood',
      disease_history: 'Hipertensi 2 tahun',
      notes: 'Pasien tampak cemas',
    };

    render(<InitialAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/Informasi Skrining Awal Nakes/i)).toBeDefined();
    expect(screen.getByText(/130\/85/)).toBeDefined();
    expect(screen.getByText(/Alergi Penisilin dan Seafood/i)).toBeDefined();
    expect(screen.getByText(/Pusing dan leher kaku/i)).toBeDefined();
    expect(screen.getByText(/36.8/)).toBeDefined();
  });
});
