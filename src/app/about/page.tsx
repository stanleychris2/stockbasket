import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About - Folio",
    description: "About Folio - Your personal stock basket tracker",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight mt-4">About Folio</h1>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">What is Folio?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Folio is a modern, intuitive stock portfolio tracker that helps you organize and visualize your stock investments.
                            Create custom baskets, track performance, analyze correlations, and make data-driven decisions—all in one place.
                        </p>
                    </section>

                    <section className="space-y-4 mt-8">
                        <h2 className="text-2xl font-semibold">Features</h2>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Create and manage custom stock baskets</li>
                            <li>Real-time stock quotes and performance tracking</li>
                            <li>Interactive multi-stock charts with custom date ranges</li>
                            <li>Returns heatmap with sortable columns</li>
                            <li>Correlation analysis for portfolio diversification</li>
                            <li>Detailed single-stock views with news and financials</li>
                            <li>Clean, modern UI built with Next.js and Tailwind CSS</li>
                        </ul>
                    </section>

                    <section className="space-y-4 mt-8">
                        <h2 className="text-2xl font-semibold">Data Storage</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Folio uses browser localStorage for personal use. Your baskets and preferences are stored locally in your browser,
                            ensuring privacy and instant access. Note that data is not synced across devices.
                        </p>
                    </section>

                    <section className="space-y-4 mt-8">
                        <h2 className="text-2xl font-semibold">Developer</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Built by{" "}
                            <a
                                href="https://christanley.xyz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium"
                            >
                                Chris Tanley
                            </a>
                        </p>
                    </section>

                    <section className="space-y-4 mt-8">
                        <h2 className="text-2xl font-semibold">Disclaimer</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Folio is a portfolio tracking tool for informational purposes only. Stock data is provided by Yahoo Finance.
                            This is not financial advice. Always do your own research before making investment decisions.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
