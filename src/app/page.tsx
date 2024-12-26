'use client';

import React from 'react';
import TwitterChecker from '@/components/TwitterChecker/TwitterChecker';
import UsernameGenerator from '@/components/UsernameGenerator/UsernameGenerator';
import RareFinder from '@/components/RareFinder/RareFinder';

export default function Home() {
  return (
    <div className="split-container">
      <main className="main-content flex-col">
        <div className="flex w-full gap-8">
          <section className="split-section left-section flex-1">
            <h2 className="section-title">Username Availability Checker</h2>
            <TwitterChecker />
          </section>

          <section className="split-section right-section flex-1">
            <h2 className="section-title">AI Username Generator</h2>
            <UsernameGenerator />
          </section>
        </div>
      </main>

      <RareFinder />
    </div>
  );
}
