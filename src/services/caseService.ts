export interface CaseResult {
  id: string;
  caseNo: string;
  title: string;
  court: string;
  judge: string;
  status: string;
  nextHearing: string;
  category: string;
  petitioner: string;
  respondent: string;
  caseSummary?: string;
}

const mockCases: CaseResult[] = [
  {
    id: '1',
    caseNo: 'W.P. (C) 1234/2024',
    title: 'John Doe vs. State of Delhi',
    court: 'Delhi High Court',
    judge: "Hon'ble Justice Rajiv Shakdher",
    status: 'Pending',
    nextHearing: '22 Jun 2026',
    category: 'Constitutional Law',
    petitioner: 'John Doe',
    respondent: 'State of Delhi',
    caseSummary: 'Petition challenging the constitutional validity of certain provisions under the IT Act.'
  },
  {
    id: '2',
    caseNo: 'CRL.A. 567/2024',
    title: 'State vs. ABC Corp',
    court: 'Supreme Court of India',
    judge: "Hon'ble CJI DY Chandrachud",
    status: 'Disposed',
    nextHearing: '-',
    category: 'Criminal Law',
    petitioner: 'State',
    respondent: 'ABC Corp',
    caseSummary: 'Appeal against conviction under Prevention of Corruption Act.'
  },
  {
    id: '3',
    caseNo: 'FAO 890/2024',
    title: 'XYZ Ltd vs. Consumer Forum',
    court: 'National Consumer Disputes Redressal Commission',
    judge: "Hon'ble Justice S.M. Kantikar",
    status: 'Pending',
    nextHearing: '15 Jul 2026',
    category: 'Consumer Law',
    petitioner: 'XYZ Ltd',
    respondent: 'Consumer Forum',
    caseSummary: 'Appeal against order of State Consumer Disputes Redressal Commission.'
  },
  {
    id: '4',
    caseNo: 'CS(OS) 456/2024',
    title: 'Property Dispute - Sharma vs. Sharma',
    court: 'Bombay High Court',
    judge: "Hon'ble Justice AS Gadkari",
    status: 'Reserved',
    nextHearing: 'Not announced',
    category: 'Civil Law',
    petitioner: 'Ramesh Sharma',
    respondent: 'Suresh Sharma',
    caseSummary: 'Partition suit regarding ancestral property.'
  },
  {
    id: '5',
    caseNo: 'RTI Appeal 234/2024',
    title: 'Transparency International vs. CPIO',
    court: 'Karnataka High Court',
    judge: "Hon'ble Justice Krishna S. Dixit",
    status: 'Pending',
    nextHearing: '30 Jul 2026',
    category: 'Service Law',
    petitioner: 'Transparency International',
    respondent: 'CPIO, Ministry of Finance',
    caseSummary: 'Appeal under RTI Act regarding disclosure of government spending data.'
  },
];

export async function searchCases(params: { query?: string; court?: string; partyName?: string; judge?: string; status?: string; category?: string }): Promise<CaseResult[]> {
  // For now, return mock data filtered by query
  // In production, this would call the backend API
  let results = mockCases;

  if (params.query) {
    const q = params.query.toLowerCase();
    results = results.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.caseNo.toLowerCase().includes(q) ||
      c.petitioner.toLowerCase().includes(q) ||
      c.respondent.toLowerCase().includes(q)
    );
  }

  if (params.court && params.court !== 'All Courts') {
    results = results.filter(c => c.court.includes(params.court!));
  }

  if (params.category && params.category !== 'All Categories') {
    results = results.filter(c => c.category.includes(params.category!));
  }

  if (params.status && params.status !== 'All Status') {
    results = results.filter(c => c.status === params.status);
  }

  if (params.judge && params.judge !== 'All Judges') {
    results = results.filter(c => c.judge.includes(params.judge!));
  }

  return results;
}
