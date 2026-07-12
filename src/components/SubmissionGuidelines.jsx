import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: 'Abstract',
    rows: [
      ['Background / Objective', 'State the context of your study and the main question you set out to answer. Explain why the study was worth doing and what gap it addresses.'],
      ['Methods', 'Briefly describe your research design, participants or data source, and how you analyzed what you collected.'],
      ['Results', 'Summarize the key outcomes and trends from your data, presented objectively.'],
      ['Conclusions', 'State what your findings mean, how they answer your research question, and any applications or next steps.'],
      ['Keywords', 'List a handful of relevant terms so readers can find your paper when searching related topics.'],
      ['Word Count', 'Abstracts should be between 200 and 250 words.'],
    ],
  },
  {
    title: 'Introduction',
    rows: [
      ['Background and Context', 'Introduce the broader field your research sits in, referencing relevant prior work.'],
      ['Problem Statement and Rationale', 'Clearly state the question you\u2019re addressing and why it matters, including gaps in existing research.'],
      ['Significance and Purpose', 'Explain how your work contributes to the field and what it might enable going forward.'],
      ['Objectives', 'State the specific goals or hypotheses guiding your study.'],
      ['Scope and Limitations', 'Define what your study does and doesn\u2019t cover, including constraints on data or resources.'],
      ['Theoretical Framework', 'If relevant, introduce the model or framework that shapes how you approached the problem.'],
      ['Methodology Overview', 'Briefly outline your general approach — save the details for the Methods section.'],
    ],
  },
  {
    title: 'Methods (For Research Papers)',
    rows: [
      ['Research Design', 'State whether your study is experimental, observational, cross-sectional, longitudinal, etc.'],
      ['Participants or Sample', 'Describe who or what was studied, including relevant demographics or selection criteria.'],
      ['Data Collection', 'Explain how data was gathered — surveys, experiments, observations — and why that method was chosen.'],
      ['Variables and Measurements', 'Define what you measured and the tools or scales used.'],
      ['Procedure', 'Walk through the sequence of steps from data collection to analysis.'],
      ['Data Analysis', 'Describe the statistical or qualitative techniques used to analyze your data.'],
      ['Ethical Considerations', 'Note any ethical concerns and how you addressed them (consent, confidentiality, etc.).'],
    ],
  },
  {
    title: 'Methods (For Systematic Reviews)',
    rows: [
      ['Search Strategy', 'Describe how you searched for relevant literature — databases, keywords, filters used.'],
      ['Inclusion Criteria', 'Explain how you decided which studies to include (publication dates, design, relevance).'],
      ['Data Extraction', 'Describe what information you pulled from each study (authors, dates, designs, findings).'],
      ['Synthesis Method', 'Explain how you organized and interpreted the gathered information.'],
      ['Quality Assessment', 'Note any tools or criteria used to evaluate the reliability of included studies.'],
    ],
  },
  {
    title: 'Discussion',
    rows: [
      ['Restatement of Key Findings', 'Concisely summarize the most important results relative to your original question.'],
      ['Implications and Significance', 'Explain how your results advance understanding in the field.'],
      ['Connection to Objectives', 'Reflect on whether your original objectives or hypotheses were met, and why or why not.'],
      ['Recommendations', 'Suggest areas for future research or practical applications based on your findings.'],
      ['Limitations', 'Be transparent about constraints, biases, or factors that may have affected your results.'],
      ['Closing Thought', 'End with a reflection or takeaway that leaves the reader with the broader significance of your work.'],
    ],
  },
];

export default function SubmissionGuidelines() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to archive
      </Link>

      <h1 className="text-2xl font-serif font-semibold text-stone-900 mt-4">
        Submission Guidelines
      </h1>
      <p className="text-stone-500 text-sm mt-1">
        Use this structure as a checklist while writing your manuscript before submitting.
      </p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-serif font-semibold text-stone-900 bg-stone-100
                           px-4 py-2 rounded-t-md border border-stone-200">
              {section.title}
            </h2>
            <div className="border border-t-0 border-stone-200 rounded-b-md overflow-hidden">
              {section.rows.map(([label, desc], i) => (
                <div
                  key={label}
                  className={`flex flex-col sm:flex-row gap-1 sm:gap-4 px-4 py-3 text-sm ${
                    i % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                  }`}
                >
                  <p className="font-semibold italic text-stone-800 sm:w-56 shrink-0">
                    {label}
                  </p>
                  <p className="text-stone-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/dashboard"
          className="inline-block text-sm font-medium bg-stone-900 text-white px-5 py-2.5
                     rounded-md hover:bg-stone-700 transition-colors"
        >
          Start Your Submission
        </Link>
      </div>
    </div>
  );
}
