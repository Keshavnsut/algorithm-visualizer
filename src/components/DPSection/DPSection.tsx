import './DPSection.css'

const DP_CATEGORIES = [
  {
    title: '1D Dynamic Programming',
    description: 'Linear-state problems where each state depends on previous indices.',
    placeholders: ['Climbing Stairs', 'House Robber', 'Coin Change'],
  },
  {
    title: '2D Dynamic Programming',
    description: 'Grid, matrix, or two-parameter state transitions.',
    placeholders: ['Unique Paths', 'Longest Common Subsequence', 'Edit Distance'],
  },
  {
    title: 'Knapsack Pattern',
    description: 'Include/exclude decisions with capacity or constraints.',
    placeholders: ['0/1 Knapsack', 'Partition Equal Subset Sum', 'Target Sum'],
  },
  {
    title: 'Longest Increasing Subsequence Pattern',
    description: 'Subsequence optimization with ordering constraints.',
    placeholders: ['LIS', 'Russian Doll Envelopes', 'Number of LIS'],
  },
  {
    title: 'Interval Dynamic Programming',
    description: 'State depends on ranges [l, r] and split points.',
    placeholders: ['Matrix Chain Multiplication', 'Burst Balloons', 'Palindrome Partitioning'],
  },
  {
    title: 'Tree Dynamic Programming',
    description: 'DP states on tree nodes with parent-child decisions.',
    placeholders: ['House Robber III', 'Diameter Variants', 'Tree Matching'],
  },
]

function DPSection() {
  return (
    <section className="visualizer-container dp-section">
      <div className="dp-header">
        <h2>Dynamic Programming Hub</h2>
        <p>
          This is the foundation structure for your DP module. We can now add problems one by one with
          explanations, state transitions, and visual demos.
        </p>
      </div>

      <div className="dp-roadmap">
        <span className="dp-badge">Phase 1: Structure</span>
        <span className="dp-badge dp-badge-muted">Phase 2: Problem Implementations</span>
        <span className="dp-badge dp-badge-muted">Phase 3: Interactive Visualizations</span>
      </div>

      <div className="dp-grid">
        {DP_CATEGORIES.map((category) => (
          <article key={category.title} className="dp-card">
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <ul>
              {category.placeholders.map((problem) => (
                <li key={problem}>{problem} (coming soon)</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DPSection
