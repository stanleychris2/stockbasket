'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OptionsContractDetail } from '@/components/OptionsContractDetail';

export default function ContractDetailPage() {
    const params = useParams();
    const symbol = params.symbol as string;
    const contractId = decodeURIComponent(params.contractId as string);

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumb Navigation */}
                <div className="mb-6 space-y-2">
                    <Link
                        href={`/options/${symbol}`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {symbol} Options Chain
                    </Link>

                    <div className="text-xs text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">Dashboard</Link>
                        {' > '}
                        <Link href={`/stock/${symbol}`} className="hover:text-foreground">{symbol}</Link>
                        {' > '}
                        <Link href={`/options/${symbol}`} className="hover:text-foreground">Options</Link>
                        {' > '}
                        <span className="text-foreground">Contract Detail</span>
                    </div>
                </div>

                {/* Contract Detail Component */}
                <OptionsContractDetail contractTicker={contractId} />

                {/* Info Footer */}
                <div className="mt-8 p-4 border rounded-lg bg-secondary/10">
                    <p className="text-sm text-muted-foreground">
                        <strong>Risk Disclaimer:</strong> Options involve substantial risk and are not suitable for all investors.
                        Past performance does not guarantee future results. This data is for informational purposes only
                        and should not be considered investment advice. Greeks and other metrics are theoretical values
                        and may not reflect actual market conditions.
                    </p>
                </div>
            </div>
        </main>
    );
}
