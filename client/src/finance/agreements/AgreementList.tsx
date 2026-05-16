import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState, Pill } from '../../shared/ui';
import { getAgreements, deleteAgreement } from '../api';
import AgreementForm from './AgreementForm';
import PaydownChart from './PaydownChart';
import type { FinanceAgreement } from '../types';

function formatMinor(minor: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  pcp: 'PCP',
  loan: 'Loan',
  bnpl: 'BNPL',
  insurance: 'Insurance',
};

const TYPE_COLOURS: Record<string, string> = {
  mortgage: '#7C3AED',
  pcp: '#0369A1',
  loan: '#D97706',
  bnpl: '#DC2626',
  insurance: '#059669',
};

export default function AgreementList() {
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [editAgreement, setEditAgreement] = useState<FinanceAgreement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPaydown, setExpandedPaydown] = useState<number | null>(null);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['finance-agreements', showAll],
    queryFn: () => getAgreements(!showAll),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgreement,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance-agreements'] });
      void qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });

  const totalMonthly = agreements
    .filter((a) => a.active)
    .reduce((sum, a) => sum + a.monthly_payment_minor, 0);

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading agreements...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Finance Agreements</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Active only' : 'Show all'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditAgreement(null);
              setShowForm(true);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {agreements.length === 0 ? (
        <EmptyState
          heading="No agreements"
          body="Add mortgages, loans, PCP, and insurance commitments."
        />
      ) : (
        <>
          <ul className="space-y-3" role="list">
            {agreements.map((a) => (
              <li key={a.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill colour={TYPE_COLOURS[a.type] ?? '#6B7280'}>
                          {TYPE_LABELS[a.type] ?? a.type}
                        </Pill>
                        {!a.active && <Pill colour="#6B7280">Inactive</Pill>}
                      </div>
                      <p className="text-body font-medium text-primary truncate">{a.name}</p>
                      {a.lender && <p className="text-caption text-secondary">{a.lender}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <span className="text-caption text-secondary">
                          <span className="font-medium text-primary">
                            {formatMinor(a.monthly_payment_minor, a.currency)}
                          </span>
                          /mo
                        </span>
                        {a.end_date && (
                          <span className="text-caption text-secondary">
                            Ends {formatDate(a.end_date)}
                          </span>
                        )}
                        {a.fixed_rate_end_date && (
                          <span className="text-caption text-secondary">
                            Fixed rate ends {formatDate(a.fixed_rate_end_date)}
                          </span>
                        )}
                        {a.balloon_payment_minor && (
                          <span className="text-caption text-secondary">
                            Balloon: {formatMinor(a.balloon_payment_minor, a.currency)}
                          </span>
                        )}
                        {a.interest_rate !== null && a.interest_rate !== undefined && (
                          <span className="text-caption text-secondary">
                            {a.interest_rate}% APR
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {a.balance_minor && a.monthly_payment_minor > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setExpandedPaydown(expandedPaydown === a.id ? null : a.id)}
                        >
                          {expandedPaydown === a.id ? 'Hide' : 'Paydown'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditAgreement(a);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => deleteMutation.mutate(a.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {expandedPaydown === a.id && (
                    <PaydownChart agreementId={a.id} name={a.name} currency={a.currency} />
                  )}
                </Card>
              </li>
            ))}
          </ul>

          {totalMonthly > 0 && (
            <Card className="bg-surface-elev">
              <div className="flex justify-between items-center">
                <p className="text-body font-medium text-secondary">Total monthly (active)</p>
                <p className="text-h2 font-bold text-primary" data-testid="total-monthly">
                  {formatMinor(totalMonthly)}
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      <AgreementForm
        open={showForm}
        agreement={editAgreement}
        onClose={() => {
          setShowForm(false);
          setEditAgreement(null);
        }}
      />
    </div>
  );
}
