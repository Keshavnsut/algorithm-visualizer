import { useEffect, useMemo, useState } from 'react'

type VisualMode = 'dp' | 'compare' | 'tree' | 'dryrun'
type ProblemView = 'visual' | 'cpp'
type ProblemId = 'climbing' | 'house' | 'coin-change' | 'unique-paths' | 'lcs' | 'edit-distance' | 'knapsack-01' | 'partition-equal-subset-sum' | 'target-sum' | 'lis' | 'russian-doll-envelopes' | 'number-of-lis' | 'matrix-chain-multiplication' | 'burst-balloons' | 'palindrome-partitioning' | 'house-robber-iii' | 'diameter-variants' | 'tree-matching'

// Sequential navigation map for all 18 problems
const PROBLEM_SEQUENCE: ProblemId[] = [
  'climbing',
  'house',
  'coin-change',
  'unique-paths',
  'lcs',
  'edit-distance',
  'knapsack-01',
  'partition-equal-subset-sum',
  'target-sum',
  'lis',
  'russian-doll-envelopes',
  'number-of-lis',
  'matrix-chain-multiplication',
  'burst-balloons',
  'palindrome-partitioning',
  'house-robber-iii',
  'diameter-variants',
  'tree-matching',
]

interface Props {
  problemId: string
  title: string
  onNavigate: (problemId: ProblemId) => void
}

interface SolverResult {
  answerLabel: string
  answerValue: string
  explanation: { recurrence: string; complexityTime: string; complexitySpace: string }
  matrix: number[][]
  transitions: string[]
  dryRunHeaders: string[]
  dryRunRows: string[][]
  estimatedRecCalls: number
  stateCount: number
  transitionCount: number
  cppCode: string
  treeRoot: string
}

interface TreeNodeView {
  id: string
  label: string
  valueText: string
  x: number
  y: number
  root: boolean
  leaf: boolean
}

interface TreeEdgeView {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  side: 'left' | 'right'
}

interface GenericTreeNode {
  value: number
  left: GenericTreeNode | null
  right: GenericTreeNode | null
}

const clampRows = (rows: string[][], maxRows = 80): string[][] => rows.slice(0, maxRows)

const parseNumberList = (raw: string): number[] => {
  return raw
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v))
}

const parseTreeLevelOrder = (raw: string): GenericTreeNode | null => {
  const tokens = raw.split(',').map((x) => x.trim())
  if (tokens.length === 0) return null
  if (tokens[0] === '' || tokens[0].toLowerCase() === 'null') return null

  const values: Array<number | null> = tokens.map((token) => {
    if (token === '' || token.toLowerCase() === 'null') return null
    const value = Number(token)
    return Number.isFinite(value) ? value : null
  })

  if (values[0] === null) return null

  const root: GenericTreeNode = { value: values[0], left: null, right: null }
  const queue: GenericTreeNode[] = [root]
  let idx = 1

  while (queue.length > 0 && idx < values.length) {
    const node = queue.shift()
    if (!node) break

    const left = values[idx++]
    if (left !== null && left !== undefined) {
      node.left = { value: left, left: null, right: null }
      queue.push(node.left)
    }

    const right = values[idx++]
    if (right !== null && right !== undefined) {
      node.right = { value: right, left: null, right: null }
      queue.push(node.right)
    }
  }

  return root
}

const collectTreeValues = (root: GenericTreeNode | null): number[] => {
  if (!root) return []
  const out: number[] = []
  const q: GenericTreeNode[] = [root]

  while (q.length > 0) {
    const node = q.shift()
    if (!node) continue
    out.push(node.value)
    if (node.left) q.push(node.left)
    if (node.right) q.push(node.right)
  }

  return out
}

const buildStaticTreeGraph = (rootLabel: string, answerValue: string) => {
  const levels: Array<Array<string | null>> = [
    [rootLabel],
    ['L', 'R'],
    ['LL', 'LR', 'RL', 'RR'],
  ]

  const width = 620
  const height = 260
  const nodes: TreeNodeView[] = []
  const edges: TreeEdgeView[] = []
  const map = new Map<string, TreeNodeView>()

  levels.forEach((level, depth) => {
    const segment = width / level.length
    level.forEach((label, slot) => {
      if (!label) return
      const node: TreeNodeView = {
        id: `${depth}-${slot}`,
        label,
        valueText: depth === 0 ? `best=${answerValue}` : 'subproblem',
        x: (slot + 0.5) * segment,
        y: 28 + depth * 72,
        root: depth === 0,
        leaf: depth === levels.length - 1,
      }
      nodes.push(node)
      map.set(node.id, node)

      if (depth > 0) {
        const parentSlot = Math.floor(slot / 2)
        const parentId = `${depth - 1}-${parentSlot}`
        const parent = map.get(parentId)
        if (parent) {
          edges.push({
            id: `${parent.id}-${node.id}`,
            fromX: parent.x,
            fromY: parent.y + 14,
            toX: node.x,
            toY: node.y - 14,
            side: slot % 2 === 0 ? 'left' : 'right',
          })
        }
      }
    })
  })

  return { width, height, nodes, edges }
}

const defaultsByProblem: Record<string, string> = {
  'knapsack-01': '1,3,4,5|1,4,5,7|7',
  'partition-equal-subset-sum': '1,5,11,5',
  'target-sum': '1,1,1,1,1|3',
  lis: '10,9,2,5,3,7,101,18',
  'russian-doll-envelopes': '5,4;6,4;6,7;2,3',
  'number-of-lis': '1,3,5,4,7',
  'matrix-chain-multiplication': '40,20,30,10,30',
  'burst-balloons': '3,1,5,8',
  'palindrome-partitioning': 'aab',
  'house-robber-iii': '3,4,5,1,3,null,1',
  'diameter-variants': '1,2,3,4,5',
  'tree-matching': '10,5,15,2,7,12,20',
}

export const ADVANCED_DP_CPP_VARIANTS: Record<string, { tabulation: string; memoization: string }> = {
  'knapsack-01': {
    tabulation: `int knapsack(vector<int>& wt, vector<int>& val, int W) {
  int n = wt.size();
  vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
  for (int i = 1; i <= n; i++) {
    for (int c = 0; c <= W; c++) {
      dp[i][c] = dp[i - 1][c];
      if (wt[i - 1] <= c) dp[i][c] = max(dp[i][c], val[i - 1] + dp[i - 1][c - wt[i - 1]]);
    }
  }
  return dp[n][W];
}`,
    memoization: `int solve(int i, int cap, vector<int>& wt, vector<int>& val, vector<vector<int>>& memo) {
  if (i == (int)wt.size()) return 0;
  if (memo[i][cap] != -1) return memo[i][cap];
  int skip = solve(i + 1, cap, wt, val, memo);
  int take = (wt[i] <= cap) ? val[i] + solve(i + 1, cap - wt[i], wt, val, memo) : 0;
  return memo[i][cap] = max(skip, take);
}`,
  },
  'partition-equal-subset-sum': {
    tabulation: `bool canPartition(vector<int>& nums) {
  int sum = accumulate(nums.begin(), nums.end(), 0);
  if (sum % 2) return false;
  int target = sum / 2;
  vector<char> dp(target + 1, false);
  dp[0] = true;
  for (int x : nums)
    for (int s = target; s >= x; s--)
      dp[s] = dp[s] || dp[s - x];
  return dp[target];
}`,
    memoization: `bool solve(int i, int target, vector<int>& nums, vector<vector<int>>& memo) {
  if (target == 0) return true;
  if (i == (int)nums.size() || target < 0) return false;
  if (memo[i][target] != -1) return memo[i][target];
  bool skip = solve(i + 1, target, nums, memo);
  bool take = solve(i + 1, target - nums[i], nums, memo);
  return memo[i][target] = (skip || take);
}`,
  },
  'target-sum': {
    tabulation: `int findTargetSumWays(vector<int>& nums, int target) {
  int sum = accumulate(nums.begin(), nums.end(), 0);
  if (sum + target < 0 || (sum + target) % 2) return 0;
  int s = (sum + target) / 2;
  vector<int> dp(s + 1, 0);
  dp[0] = 1;
  for (int x : nums)
    for (int j = s; j >= x; j--)
      dp[j] += dp[j - x];
  return dp[s];
}`,
    memoization: `int solve(int i, int cur, vector<int>& nums, int target, unordered_map<long long, int>& memo) {
  if (i == (int)nums.size()) return cur == target;
  long long key = ((long long)i << 32) ^ (cur + 20000);
  if (memo.count(key)) return memo[key];
  int plus = solve(i + 1, cur + nums[i], nums, target, memo);
  int minus = solve(i + 1, cur - nums[i], nums, target, memo);
  return memo[key] = plus + minus;
}`,
  },
  lis: {
    tabulation: `int lengthOfLIS(vector<int>& nums) {
  int n = nums.size();
  vector<int> dp(n, 1);
  int ans = 0;
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) if (nums[j] < nums[i]) dp[i] = max(dp[i], dp[j] + 1);
    ans = max(ans, dp[i]);
  }
  return ans;
}`,
    memoization: `int solve(int i, int prev, vector<int>& nums, vector<vector<int>>& memo) {
  if (i == (int)nums.size()) return 0;
  if (memo[i][prev + 1] != -1) return memo[i][prev + 1];
  int skip = solve(i + 1, prev, nums, memo);
  int take = 0;
  if (prev == -1 || nums[i] > nums[prev]) take = 1 + solve(i + 1, i, nums, memo);
  return memo[i][prev + 1] = max(skip, take);
}`,
  },
  'russian-doll-envelopes': {
    tabulation: `int maxEnvelopes(vector<vector<int>>& env) {
  sort(env.begin(), env.end(), [](auto& a, auto& b) {
    if (a[0] == b[0]) return a[1] > b[1];
    return a[0] < b[0];
  });
  vector<int> tails;
  for (auto& e : env) {
    auto it = lower_bound(tails.begin(), tails.end(), e[1]);
    if (it == tails.end()) tails.push_back(e[1]);
    else *it = e[1];
  }
  return (int)tails.size();
}`,
    memoization: `int solve(int i, int prev, vector<pair<int,int>>& a, vector<vector<int>>& memo) {
  if (i == (int)a.size()) return 0;
  if (memo[i][prev + 1] != -1) return memo[i][prev + 1];
  int skip = solve(i + 1, prev, a, memo);
  int take = 0;
  if (prev == -1 || (a[i].first > a[prev].first && a[i].second > a[prev].second)) {
    take = 1 + solve(i + 1, i, a, memo);
  }
  return memo[i][prev + 1] = max(skip, take);
}`,
  },
  'number-of-lis': {
    tabulation: `int findNumberOfLIS(vector<int>& nums) {
  int n = nums.size();
  vector<int> len(n, 1), cnt(n, 1);
  int best = 0;
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) if (nums[j] < nums[i]) {
      if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; cnt[i] = cnt[j]; }
      else if (len[j] + 1 == len[i]) cnt[i] += cnt[j];
    }
    best = max(best, len[i]);
  }
  int ans = 0;
  for (int i = 0; i < n; i++) if (len[i] == best) ans += cnt[i];
  return ans;
}`,
    memoization: `pair<int,int> solve(int i, vector<int>& nums, vector<pair<int,int>>& memo) {
  if (memo[i].first != -1) return memo[i];
  int bestLen = 1, ways = 1;
  for (int j = i + 1; j < (int)nums.size(); j++) if (nums[j] > nums[i]) {
    auto [l, c] = solve(j, nums, memo);
    if (1 + l > bestLen) { bestLen = 1 + l; ways = c; }
    else if (1 + l == bestLen) ways += c;
  }
  return memo[i] = {bestLen, ways};
}`,
  },
  'matrix-chain-multiplication': {
    tabulation: `int matrixChain(vector<int>& p) {
  int n = (int)p.size() - 1;
  vector<vector<int>> dp(n, vector<int>(n, 0));
  for (int len = 2; len <= n; len++) {
    for (int i = 0; i + len - 1 < n; i++) {
      int j = i + len - 1;
      dp[i][j] = INT_MAX;
      for (int k = i; k < j; k++) {
        dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1]);
      }
    }
  }
  return dp[0][n - 1];
}`,
    memoization: `int solve(int i, int j, vector<int>& p, vector<vector<int>>& memo) {
  if (i == j) return 0;
  if (memo[i][j] != -1) return memo[i][j];
  int best = INT_MAX;
  for (int k = i; k < j; k++) {
    best = min(best, solve(i, k, p, memo) + solve(k + 1, j, p, memo) + p[i] * p[k + 1] * p[j + 1]);
  }
  return memo[i][j] = best;
}`,
  },
  'burst-balloons': {
    tabulation: `int maxCoins(vector<int>& nums) {
  vector<int> a{1};
  a.insert(a.end(), nums.begin(), nums.end());
  a.push_back(1);
  int n = a.size();
  vector<vector<int>> dp(n, vector<int>(n, 0));
  for (int len = 2; len < n; len++) {
    for (int l = 0; l + len < n; l++) {
      int r = l + len;
      for (int k = l + 1; k < r; k++)
        dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
    }
  }
  return dp[0][n - 1];
}`,
    memoization: `int solve(int l, int r, vector<int>& a, vector<vector<int>>& memo) {
  if (l + 1 >= r) return 0;
  if (memo[l][r] != -1) return memo[l][r];
  int best = 0;
  for (int k = l + 1; k < r; k++) {
    best = max(best, solve(l, k, a, memo) + solve(k, r, a, memo) + a[l] * a[k] * a[r]);
  }
  return memo[l][r] = best;
}`,
  },
  'palindrome-partitioning': {
    tabulation: `int minCut(string s) {
  int n = s.size();
  vector<vector<char>> pal(n, vector<char>(n, false));
  vector<int> cut(n, 0);
  for (int i = 0; i < n; i++) {
    cut[i] = i;
    for (int j = 0; j <= i; j++) {
      if (s[i] == s[j] && (i - j <= 1 || pal[j + 1][i - 1])) {
        pal[j][i] = true;
        cut[i] = (j == 0) ? 0 : min(cut[i], cut[j - 1] + 1);
      }
    }
  }
  return cut[n - 1];
}`,
    memoization: `int solve(int i, string& s, vector<int>& memo, vector<vector<int>>& pal) {
  int n = s.size();
  if (i == n) return -1;
  if (memo[i] != -1) return memo[i];
  int best = INT_MAX;
  for (int j = i; j < n; j++) {
    if (pal[i][j]) best = min(best, 1 + solve(j + 1, s, memo, pal));
  }
  return memo[i] = best;
}`,
  },
  'house-robber-iii': {
    tabulation: `pair<int,int> dfs(TreeNode* node) {
  if (!node) return {0, 0};
  auto L = dfs(node->left), R = dfs(node->right);
  int rob = node->val + L.second + R.second;
  int skip = max(L.first, L.second) + max(R.first, R.second);
  return {rob, skip};
}
int rob(TreeNode* root) {
  auto p = dfs(root);
  return max(p.first, p.second);
}`,
    memoization: `unordered_map<TreeNode*, int> memo;
int solve(TreeNode* node) {
  if (!node) return 0;
  if (memo.count(node)) return memo[node];
  int take = node->val;
  if (node->left) take += solve(node->left->left) + solve(node->left->right);
  if (node->right) take += solve(node->right->left) + solve(node->right->right);
  int skip = solve(node->left) + solve(node->right);
  return memo[node] = max(take, skip);
}`,
  },
  'diameter-variants': {
    tabulation: `int best = 0;
int height(TreeNode* node) {
  if (!node) return 0;
  int lh = height(node->left), rh = height(node->right);
  best = max(best, lh + rh);
  return 1 + max(lh, rh);
}
int diameterOfBinaryTree(TreeNode* root) {
  height(root);
  return best;
}`,
    memoization: `unordered_map<TreeNode*, int> hMemo;
int height(TreeNode* node) {
  if (!node) return 0;
  if (hMemo.count(node)) return hMemo[node];
  return hMemo[node] = 1 + max(height(node->left), height(node->right));
}
int diameter(TreeNode* root) {
  if (!root) return 0;
  int through = height(root->left) + height(root->right);
  return max(through, max(diameter(root->left), diameter(root->right)));
}`,
  },
  'tree-matching': {
    tabulation: `pair<int,int> dfs(TreeNode* u) {
  if (!u) return {0, 0};
  auto L = dfs(u->left), R = dfs(u->right);
  int free = max(L.first, L.second) + max(R.first, R.second);
  int match = 0;
  if (u->left) match = max(match, 1 + L.second + max(R.first, R.second));
  if (u->right) match = max(match, 1 + R.second + max(L.first, L.second));
  return {free, match};
}`,
    memoization: `unordered_map<TreeNode*, pair<int,int>> memo;
pair<int,int> solve(TreeNode* u) {
  if (!u) return {0, 0};
  if (memo.count(u)) return memo[u];
  auto L = solve(u->left), R = solve(u->right);
  int free = max(L.first, L.second) + max(R.first, R.second);
  int match = 0;
  if (u->left) match = max(match, 1 + L.second + max(R.first, R.second));
  if (u->right) match = max(match, 1 + R.second + max(L.first, L.second));
  return memo[u] = {free, match};
}`,
  },
}

const formatRatio = (calls: number, states: number): string => {
  if (states <= 0) return 'N/A'
  return (calls / states).toFixed(2)
}

const toSingleRow = (arr: number[]): number[][] => [arr]

const solveProblem = (problemId: string, rawInput: string): SolverResult => {
  switch (problemId) {
    case 'knapsack-01': {
      const [weightsRaw = '', valuesRaw = '', capRaw = '0'] = rawInput.split('|')
      const weights = parseNumberList(weightsRaw).map((v) => Math.max(0, Math.floor(v)))
      const values = parseNumberList(valuesRaw).map((v) => Math.max(0, Math.floor(v)))
      const n = Math.min(weights.length, values.length)
      const capacity = Math.max(0, Math.floor(Number(capRaw) || 0))
      const dp = Array.from({ length: n + 1 }, () => Array.from({ length: capacity + 1 }, () => 0))
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let i = 1; i <= n; i++) {
        for (let c = 0; c <= capacity; c++) {
          const skip = dp[i - 1][c]
          let take = Number.MIN_SAFE_INTEGER
          if (weights[i - 1] <= c) {
            take = values[i - 1] + dp[i - 1][c - weights[i - 1]]
          }
          dp[i][c] = Math.max(skip, take)
          if (transitions.length < 30) {
            transitions.push(`dp[${i}][${c}] = max(skip=${skip}, take=${take === Number.MIN_SAFE_INTEGER ? 'N/A' : take}) => ${dp[i][c]}`)
          }
          dryRows.push([
            `${i}`,
            `${c}`,
            `${weights[i - 1]}`,
            `${values[i - 1]}`,
            `${skip}`,
            `${take === Number.MIN_SAFE_INTEGER ? 'N/A' : take}`,
            `${dp[i][c]}`,
          ])
        }
      }

      return {
        answerLabel: 'Maximum Value',
        answerValue: `${dp[n]?.[capacity] ?? 0}`,
        explanation: {
          recurrence: 'dp[i][c] = max(dp[i-1][c], value[i-1] + dp[i-1][c-weight[i-1]])',
          complexityTime: `O(n*W) where n=${n}, W=${capacity}`,
          complexitySpace: 'O(n*W)',
        },
        matrix: dp,
        transitions,
        dryRunHeaders: ['Item', 'Cap', 'Wt', 'Val', 'Skip', 'Take', 'Best'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, n)),
        stateCount: (n + 1) * (capacity + 1),
        transitionCount: n * (capacity + 1),
        cppCode: `int knapsack(vector<int>& wt, vector<int>& val, int W) {\n  int n = wt.size();\n  vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));\n  for (int i = 1; i <= n; i++) {\n    for (int c = 0; c <= W; c++) {\n      dp[i][c] = dp[i - 1][c];\n      if (wt[i - 1] <= c) {\n        dp[i][c] = max(dp[i][c], val[i - 1] + dp[i - 1][c - wt[i - 1]]);\n      }\n    }\n  }\n  return dp[n][W];\n}`,
        treeRoot: `K(${n},${capacity})`,
      }
    }

    case 'partition-equal-subset-sum': {
      const nums = parseNumberList(rawInput).map((v) => Math.max(0, Math.floor(v)))
      const sum = nums.reduce((acc, v) => acc + v, 0)
      if (sum % 2 !== 0) {
        return {
          answerLabel: 'Can Partition',
          answerValue: 'false',
          explanation: {
            recurrence: 'If total sum is odd, partition is impossible.',
            complexityTime: 'O(n*target)',
            complexitySpace: 'O(target)',
          },
          matrix: [[sum]],
          transitions: [`sum=${sum} is odd -> false`],
          dryRunHeaders: ['Info'],
          dryRunRows: [['Total sum is odd, no equal partition exists']],
          estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, nums.length)),
          stateCount: nums.length,
          transitionCount: nums.length,
          cppCode: `bool canPartition(vector<int>& nums) {\n  int sum = accumulate(nums.begin(), nums.end(), 0);\n  if (sum % 2) return false;\n  int target = sum / 2;\n  vector<char> dp(target + 1, false);\n  dp[0] = true;\n  for (int x : nums) {\n    for (int s = target; s >= x; s--) {\n      dp[s] = dp[s] || dp[s - x];\n    }\n  }\n  return dp[target];\n}`,
          treeRoot: `P(${nums.length},${Math.floor(sum / 2)})`,
        }
      }

      const target = Math.floor(sum / 2)
      const dp = Array.from({ length: target + 1 }, () => false)
      dp[0] = true
      const snapshots: number[][] = [dp.map((v) => (v ? 1 : 0))]
      const transitions: string[] = []
      const dryRows: string[][] = []

      nums.forEach((x, idx) => {
        for (let s = target; s >= x; s--) {
          if (dp[s - x]) dp[s] = true
        }
        snapshots.push(dp.map((v) => (v ? 1 : 0)))
        transitions.push(`After nums[${idx}]=${x}, reachable sums updated.`)
        dryRows.push([`${idx}`, `${x}`, `${dp[target]}`])
      })

      return {
        answerLabel: 'Can Partition',
        answerValue: `${dp[target]}`,
        explanation: {
          recurrence: 'Subset sum: dp[s] |= dp[s-num] in reverse order',
          complexityTime: `O(n*target), target=${target}`,
          complexitySpace: 'O(target)',
        },
        matrix: snapshots,
        transitions,
        dryRunHeaders: ['Index', 'Value', 'Target Reachable'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, nums.length)),
        stateCount: nums.length * (target + 1),
        transitionCount: nums.length * (target + 1),
        cppCode: `bool canPartition(vector<int>& nums) {\n  int sum = accumulate(nums.begin(), nums.end(), 0);\n  if (sum % 2) return false;\n  int target = sum / 2;\n  vector<char> dp(target + 1, false);\n  dp[0] = true;\n  for (int x : nums)\n    for (int s = target; s >= x; s--)\n      dp[s] = dp[s] || dp[s - x];\n  return dp[target];\n}`,
        treeRoot: `P(${nums.length},${target})`,
      }
    }

    case 'target-sum': {
      const [numsRaw = '', tRaw = '0'] = rawInput.split('|')
      const nums = parseNumberList(numsRaw).map((v) => Math.abs(Math.floor(v)))
      const target = Math.floor(Number(tRaw) || 0)
      const total = nums.reduce((acc, v) => acc + v, 0)
      const subset = total + target
      if (subset < 0 || subset % 2 !== 0) {
        return {
          answerLabel: 'Ways to Reach Target',
          answerValue: '0',
          explanation: {
            recurrence: 'Convert to count subset sum with (sum + target)/2.',
            complexityTime: 'O(n*S)',
            complexitySpace: 'O(S)',
          },
          matrix: [[total, target]],
          transitions: ['(sum + target) is invalid -> no solution'],
          dryRunHeaders: ['Info'],
          dryRunRows: [['No valid subset target from transformation']],
          estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, nums.length)),
          stateCount: nums.length,
          transitionCount: nums.length,
          cppCode: `int findTargetSumWays(vector<int>& nums, int target) {\n  int sum = accumulate(nums.begin(), nums.end(), 0);\n  if (sum + target < 0 || (sum + target) % 2) return 0;\n  int s = (sum + target) / 2;\n  vector<int> dp(s + 1, 0);\n  dp[0] = 1;\n  for (int x : nums) {\n    for (int j = s; j >= x; j--) dp[j] += dp[j - x];\n  }\n  return dp[s];\n}`,
          treeRoot: `T(${nums.length},${target})`,
        }
      }

      const s = Math.floor(subset / 2)
      const dp = Array.from({ length: s + 1 }, () => 0)
      dp[0] = 1
      const snapshots: number[][] = [dp.slice()]
      const transitions: string[] = []
      const dryRows: string[][] = []

      nums.forEach((x, idx) => {
        for (let j = s; j >= x; j--) {
          dp[j] += dp[j - x]
        }
        snapshots.push(dp.slice())
        transitions.push(`After nums[${idx}]=${x}, ways[${s}]=${dp[s]}`)
        dryRows.push([`${idx}`, `${x}`, `${dp[s]}`])
      })

      return {
        answerLabel: 'Ways to Reach Target',
        answerValue: `${dp[s]}`,
        explanation: {
          recurrence: 'Count subsets with sum S=(sum+target)/2',
          complexityTime: `O(n*S), S=${s}`,
          complexitySpace: 'O(S)',
        },
        matrix: snapshots,
        transitions,
        dryRunHeaders: ['Index', 'Value', 'Ways(S)'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, nums.length)),
        stateCount: nums.length * (s + 1),
        transitionCount: nums.length * (s + 1),
        cppCode: `int findTargetSumWays(vector<int>& nums, int target) {\n  int sum = accumulate(nums.begin(), nums.end(), 0);\n  if (sum + target < 0 || (sum + target) % 2) return 0;\n  int s = (sum + target) / 2;\n  vector<int> dp(s + 1, 0);\n  dp[0] = 1;\n  for (int x : nums)\n    for (int j = s; j >= x; j--)\n      dp[j] += dp[j - x];\n  return dp[s];\n}`,
        treeRoot: `T(${nums.length},${target})`,
      }
    }

    case 'lis': {
      const nums = parseNumberList(rawInput)
      const n = nums.length
      const dp = Array.from({ length: n }, () => 1)
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
          if (nums[j] < nums[i]) {
            dp[i] = Math.max(dp[i], dp[j] + 1)
          }
        }
        transitions.push(`LIS ending at index ${i} (${nums[i]}) = ${dp[i]}`)
        dryRows.push([`${i}`, `${nums[i]}`, `${dp[i]}`])
      }

      const best = n === 0 ? 0 : Math.max(...dp)

      return {
        answerLabel: 'LIS Length',
        answerValue: `${best}`,
        explanation: {
          recurrence: 'dp[i] = 1 + max(dp[j]) for all j<i and nums[j] < nums[i]',
          complexityTime: 'O(n^2)',
          complexitySpace: 'O(n)',
        },
        matrix: toSingleRow(dp),
        transitions,
        dryRunHeaders: ['Index', 'Value', 'LIS Ending Here'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, n)),
        stateCount: n,
        transitionCount: Math.max(0, (n * (n - 1)) / 2),
        cppCode: `int lengthOfLIS(vector<int>& nums) {\n  int n = nums.size();\n  vector<int> dp(n, 1);\n  int ans = 0;\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < i; j++)\n      if (nums[j] < nums[i]) dp[i] = max(dp[i], dp[j] + 1);\n    ans = max(ans, dp[i]);\n  }\n  return ans;\n}`,
        treeRoot: `LIS(${n})`,
      }
    }

    case 'russian-doll-envelopes': {
      const pairs = rawInput
        .split(';')
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)
        .map((segment) => {
          const [w, h] = segment.split(',').map((v) => Number(v.trim()))
          return { w: Number.isFinite(w) ? w : 0, h: Number.isFinite(h) ? h : 0 }
        })

      pairs.sort((a, b) => (a.w === b.w ? b.h - a.h : a.w - b.w))
      const tails: number[] = []
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let i = 0; i < pairs.length; i++) {
        const h = pairs[i].h
        let lo = 0
        let hi = tails.length
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2)
          if (tails[mid] < h) lo = mid + 1
          else hi = mid
        }
        tails[lo] = h
        transitions.push(`Envelope (${pairs[i].w},${h}) updates tails at ${lo}.`)
        dryRows.push([`${i}`, `(${pairs[i].w},${h})`, `[${tails.join(', ')}]`])
      }

      return {
        answerLabel: 'Max Nested Envelopes',
        answerValue: `${tails.length}`,
        explanation: {
          recurrence: 'Sort by width asc, height desc, then LIS on heights.',
          complexityTime: 'O(n log n)',
          complexitySpace: 'O(n)',
        },
        matrix: toSingleRow(tails),
        transitions,
        dryRunHeaders: ['Step', 'Envelope', 'Tails'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, pairs.length)),
        stateCount: pairs.length,
        transitionCount: pairs.length,
        cppCode: `int maxEnvelopes(vector<vector<int>>& env) {\n  sort(env.begin(), env.end(), [](auto& a, auto& b) {\n    if (a[0] == b[0]) return a[1] > b[1];\n    return a[0] < b[0];\n  });\n  vector<int> tails;\n  for (auto& e : env) {\n    int h = e[1];\n    auto it = lower_bound(tails.begin(), tails.end(), h);\n    if (it == tails.end()) tails.push_back(h);\n    else *it = h;\n  }\n  return (int)tails.size();\n}`,
        treeRoot: `RDE(${pairs.length})`,
      }
    }

    case 'number-of-lis': {
      const nums = parseNumberList(rawInput)
      const n = nums.length
      if (n === 0) {
        return {
          answerLabel: 'Number of LIS',
          answerValue: '0',
          explanation: {
            recurrence: 'Maintain length and count for each index.',
            complexityTime: 'O(n^2)',
            complexitySpace: 'O(n)',
          },
          matrix: [[0]],
          transitions: ['Empty input'],
          dryRunHeaders: ['Info'],
          dryRunRows: [['No sequence']],
          estimatedRecCalls: 1,
          stateCount: 0,
          transitionCount: 0,
          cppCode: `int findNumberOfLIS(vector<int>& nums) {\n  int n = nums.size();\n  vector<int> len(n, 1), cnt(n, 1);\n  int best = 0;\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < i; j++) if (nums[j] < nums[i]) {\n      if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; cnt[i] = cnt[j]; }\n      else if (len[j] + 1 == len[i]) cnt[i] += cnt[j];\n    }\n    best = max(best, len[i]);\n  }\n  int ans = 0;\n  for (int i = 0; i < n; i++) if (len[i] == best) ans += cnt[i];\n  return ans;\n}`,
          treeRoot: 'NLIS(0)',
        }
      }

      const len = Array.from({ length: n }, () => 1)
      const cnt = Array.from({ length: n }, () => 1)
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
          if (nums[j] >= nums[i]) continue
          if (len[j] + 1 > len[i]) {
            len[i] = len[j] + 1
            cnt[i] = cnt[j]
          } else if (len[j] + 1 === len[i]) {
            cnt[i] += cnt[j]
          }
        }
        transitions.push(`i=${i}, len=${len[i]}, count=${cnt[i]}`)
        dryRows.push([`${i}`, `${nums[i]}`, `${len[i]}`, `${cnt[i]}`])
      }

      const best = Math.max(...len)
      let ways = 0
      for (let i = 0; i < n; i++) if (len[i] === best) ways += cnt[i]

      return {
        answerLabel: 'Number of LIS',
        answerValue: `${ways} (length ${best})`,
        explanation: {
          recurrence: 'Track best length and number of ways ending at each index.',
          complexityTime: 'O(n^2)',
          complexitySpace: 'O(n)',
        },
        matrix: [len, cnt],
        transitions,
        dryRunHeaders: ['Index', 'Value', 'Len', 'Count'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, n)),
        stateCount: n,
        transitionCount: Math.max(0, (n * (n - 1)) / 2),
        cppCode: `int findNumberOfLIS(vector<int>& nums) {\n  int n = nums.size();\n  vector<int> len(n, 1), cnt(n, 1);\n  int best = 0;\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < i; j++) if (nums[j] < nums[i]) {\n      if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; cnt[i] = cnt[j]; }\n      else if (len[j] + 1 == len[i]) cnt[i] += cnt[j];\n    }\n    best = max(best, len[i]);\n  }\n  int ans = 0;\n  for (int i = 0; i < n; i++) if (len[i] == best) ans += cnt[i];\n  return ans;\n}`,
        treeRoot: `NLIS(${n})`,
      }
    }

    case 'matrix-chain-multiplication': {
      const dims = parseNumberList(rawInput).map((v) => Math.max(1, Math.floor(v)))
      const n = Math.max(0, dims.length - 1)
      if (n <= 1) {
        return {
          answerLabel: 'Minimum Multiplications',
          answerValue: '0',
          explanation: {
            recurrence: 'Need at least 2 matrices for multiplication cost.',
            complexityTime: 'O(n^3)',
            complexitySpace: 'O(n^2)',
          },
          matrix: [[0]],
          transitions: ['Insufficient dimensions'],
          dryRunHeaders: ['Info'],
          dryRunRows: [['Provide at least 3 dimensions']],
          estimatedRecCalls: 1,
          stateCount: 1,
          transitionCount: 0,
          cppCode: `int matrixChain(vector<int>& p) {\n  int n = (int)p.size() - 1;\n  vector<vector<int>> dp(n, vector<int>(n, 0));\n  for (int len = 2; len <= n; len++) {\n    for (int i = 0; i + len - 1 < n; i++) {\n      int j = i + len - 1;\n      dp[i][j] = INT_MAX;\n      for (int k = i; k < j; k++) {\n        dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1]);\n      }\n    }\n  }\n  return dp[0][n - 1];\n}`,
          treeRoot: 'MCM(0,0)',
        }
      }

      const dp = Array.from({ length: n }, () => Array.from({ length: n }, () => 0))
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1
          let best = Number.MAX_SAFE_INTEGER
          for (let k = i; k < j; k++) {
            const cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]
            best = Math.min(best, cost)
            dryRows.push([`${i}`, `${j}`, `${k}`, `${cost}`])
          }
          dp[i][j] = best
          transitions.push(`dp[${i}][${j}] = ${best}`)
        }
      }

      return {
        answerLabel: 'Minimum Multiplications',
        answerValue: `${dp[0][n - 1]}`,
        explanation: {
          recurrence: 'dp[i][j] = min(dp[i][k] + dp[k+1][j] + p[i]*p[k+1]*p[j+1])',
          complexityTime: 'O(n^3)',
          complexitySpace: 'O(n^2)',
        },
        matrix: dp,
        transitions,
        dryRunHeaders: ['i', 'j', 'k', 'Cost'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, n)),
        stateCount: n * n,
        transitionCount: Math.max(1, n * n * n),
        cppCode: `int matrixChain(vector<int>& p) {\n  int n = (int)p.size() - 1;\n  vector<vector<int>> dp(n, vector<int>(n, 0));\n  for (int len = 2; len <= n; len++) {\n    for (int i = 0; i + len - 1 < n; i++) {\n      int j = i + len - 1;\n      dp[i][j] = INT_MAX;\n      for (int k = i; k < j; k++) {\n        dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1]);\n      }\n    }\n  }\n  return dp[0][n - 1];\n}`,
        treeRoot: `MCM(0,${n - 1})`,
      }
    }

    case 'burst-balloons': {
      const numsRaw = parseNumberList(rawInput).map((v) => Math.max(0, Math.floor(v)))
      const arr = [1, ...numsRaw, 1]
      const n = arr.length
      const dp = Array.from({ length: n }, () => Array.from({ length: n }, () => 0))
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let len = 2; len < n; len++) {
        for (let left = 0; left + len < n; left++) {
          const right = left + len
          let best = 0
          for (let k = left + 1; k < right; k++) {
            const coins = dp[left][k] + dp[k][right] + arr[left] * arr[k] * arr[right]
            if (coins > best) best = coins
            dryRows.push([`${left}`, `${right}`, `${k}`, `${coins}`])
          }
          dp[left][right] = best
          transitions.push(`dp[${left}][${right}] = ${best}`)
        }
      }

      return {
        answerLabel: 'Maximum Coins',
        answerValue: `${dp[0][n - 1]}`,
        explanation: {
          recurrence: 'Pick last balloon k in interval (l,r): dp[l][r] = max(dp[l][k]+dp[k][r]+a[l]*a[k]*a[r])',
          complexityTime: 'O(n^3)',
          complexitySpace: 'O(n^2)',
        },
        matrix: dp,
        transitions,
        dryRunHeaders: ['Left', 'Right', 'Last k', 'Coins'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, Math.max(1, numsRaw.length))),
        stateCount: n * n,
        transitionCount: Math.max(1, n * n * n),
        cppCode: `int maxCoins(vector<int>& nums) {\n  vector<int> a{1};\n  a.insert(a.end(), nums.begin(), nums.end());\n  a.push_back(1);\n  int n = a.size();\n  vector<vector<int>> dp(n, vector<int>(n, 0));\n  for (int len = 2; len < n; len++) {\n    for (int l = 0; l + len < n; l++) {\n      int r = l + len;\n      for (int k = l + 1; k < r; k++)\n        dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);\n    }\n  }\n  return dp[0][n - 1];\n}`,
        treeRoot: `B(0,${n - 1})`,
      }
    }

    case 'palindrome-partitioning': {
      const s = rawInput.trim()
      const n = s.length
      if (n === 0) {
        return {
          answerLabel: 'Minimum Cuts',
          answerValue: '0',
          explanation: {
            recurrence: 'Empty string needs 0 cuts.',
            complexityTime: 'O(n^2)',
            complexitySpace: 'O(n^2)',
          },
          matrix: [[0]],
          transitions: ['Empty string'],
          dryRunHeaders: ['Info'],
          dryRunRows: [['Provide a non-empty string']],
          estimatedRecCalls: 1,
          stateCount: 1,
          transitionCount: 0,
          cppCode: `int minCut(string s) {\n  int n = s.size();\n  vector<vector<char>> pal(n, vector<char>(n, false));\n  vector<int> cut(n, 0);\n  for (int i = 0; i < n; i++) {\n    cut[i] = i;\n    for (int j = 0; j <= i; j++) {\n      if (s[i] == s[j] && (i - j <= 1 || pal[j + 1][i - 1])) {\n        pal[j][i] = true;\n        cut[i] = (j == 0) ? 0 : min(cut[i], cut[j - 1] + 1);\n      }\n    }\n  }\n  return cut[n - 1];\n}`,
          treeRoot: 'PP(0)',
        }
      }

      const pal = Array.from({ length: n }, () => Array.from({ length: n }, () => false))
      const cut = Array.from({ length: n }, (_, i) => i)
      const transitions: string[] = []
      const dryRows: string[][] = []

      for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
          if (s[i] === s[j] && (i - j <= 1 || pal[j + 1][i - 1])) {
            pal[j][i] = true
            cut[i] = j === 0 ? 0 : Math.min(cut[i], cut[j - 1] + 1)
            dryRows.push([`${j}`, `${i}`, s.slice(j, i + 1), `${cut[i]}`])
          }
        }
        transitions.push(`Min cuts for prefix [0..${i}] = ${cut[i]}`)
      }

      const palAsNums = pal.map((row) => row.map((v) => (v ? 1 : 0)))

      return {
        answerLabel: 'Minimum Cuts',
        answerValue: `${cut[n - 1]}`,
        explanation: {
          recurrence: 'If s[j..i] palindrome, cut[i] = min(cut[i], cut[j-1] + 1)',
          complexityTime: 'O(n^2)',
          complexitySpace: 'O(n^2)',
        },
        matrix: palAsNums,
        transitions,
        dryRunHeaders: ['Start', 'End', 'Palindrome', 'Cuts(i)'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, n)),
        stateCount: n * n,
        transitionCount: n * n,
        cppCode: `int minCut(string s) {\n  int n = s.size();\n  vector<vector<char>> pal(n, vector<char>(n, false));\n  vector<int> cut(n, 0);\n  for (int i = 0; i < n; i++) {\n    cut[i] = i;\n    for (int j = 0; j <= i; j++) {\n      if (s[i] == s[j] && (i - j <= 1 || pal[j + 1][i - 1])) {\n        pal[j][i] = true;\n        cut[i] = (j == 0) ? 0 : min(cut[i], cut[j - 1] + 1);\n      }\n    }\n  }\n  return cut[n - 1];\n}`,
        treeRoot: `PP(${n})`,
      }
    }

    case 'house-robber-iii': {
      const root = parseTreeLevelOrder(rawInput)
      const values = collectTreeValues(root)
      const transitions: string[] = []
      const dryRows: string[][] = []

      const dfs = (node: GenericTreeNode | null): [number, number] => {
        if (!node) return [0, 0]
        const [leftTake, leftSkip] = dfs(node.left)
        const [rightTake, rightSkip] = dfs(node.right)
        const rob = node.value + leftSkip + rightSkip
        const skip = Math.max(leftTake, leftSkip) + Math.max(rightTake, rightSkip)
        transitions.push(`node=${node.value}, rob=${rob}, skip=${skip}`)
        dryRows.push([`${node.value}`, `${rob}`, `${skip}`])
        return [rob, skip]
      }

      const [take, skip] = dfs(root)
      const ans = Math.max(take, skip)

      return {
        answerLabel: 'Maximum Loot on Tree',
        answerValue: `${ans}`,
        explanation: {
          recurrence: 'For each node: rob = val + skip(left) + skip(right), skip = max(left) + max(right)',
          complexityTime: 'O(n)',
          complexitySpace: 'O(h) recursion stack',
        },
        matrix: [values],
        transitions,
        dryRunHeaders: ['Node', 'Rob', 'Skip'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, Math.max(1, values.length))),
        stateCount: values.length * 2,
        transitionCount: values.length,
        cppCode: `pair<int,int> dfs(TreeNode* node) {\n  if (!node) return {0, 0};\n  auto L = dfs(node->left), R = dfs(node->right);\n  int rob = node->val + L.second + R.second;\n  int skip = max(L.first, L.second) + max(R.first, R.second);\n  return {rob, skip};\n}\nint rob(TreeNode* root) {\n  auto p = dfs(root);\n  return max(p.first, p.second);\n}`,
        treeRoot: 'HR3(root)',
      }
    }

    case 'diameter-variants': {
      const root = parseTreeLevelOrder(rawInput)
      const values = collectTreeValues(root)
      let diameter = 0
      const transitions: string[] = []
      const dryRows: string[][] = []

      const height = (node: GenericTreeNode | null): number => {
        if (!node) return 0
        const lh = height(node.left)
        const rh = height(node.right)
        diameter = Math.max(diameter, lh + rh)
        transitions.push(`node=${node.value}, lh=${lh}, rh=${rh}, bestDiameter=${diameter}`)
        dryRows.push([`${node.value}`, `${lh}`, `${rh}`, `${lh + rh}`])
        return 1 + Math.max(lh, rh)
      }

      height(root)

      return {
        answerLabel: 'Tree Diameter (edges)',
        answerValue: `${diameter}`,
        explanation: {
          recurrence: 'At each node, candidate diameter is leftHeight + rightHeight.',
          complexityTime: 'O(n)',
          complexitySpace: 'O(h)',
        },
        matrix: [values],
        transitions,
        dryRunHeaders: ['Node', 'Left H', 'Right H', 'Through Node'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, Math.max(1, values.length))),
        stateCount: values.length,
        transitionCount: values.length,
        cppCode: `int best = 0;\nint height(TreeNode* node) {\n  if (!node) return 0;\n  int lh = height(node->left), rh = height(node->right);\n  best = max(best, lh + rh);\n  return 1 + max(lh, rh);\n}\nint diameterOfBinaryTree(TreeNode* root) {\n  height(root);\n  return best;\n}`,
        treeRoot: 'D(root)',
      }
    }

    case 'tree-matching': {
      const root = parseTreeLevelOrder(rawInput)
      const values = collectTreeValues(root)
      const transitions: string[] = []
      const dryRows: string[][] = []

      const dfs = (node: GenericTreeNode | null): [number, number] => {
        if (!node) return [0, 0]
        const left = dfs(node.left)
        const right = dfs(node.right)

        const noParentMatch = Math.max(left[0], left[1]) + Math.max(right[0], right[1])

        let withParentMatch = 0
        if (node.left) {
          withParentMatch = Math.max(withParentMatch, 1 + left[1] + Math.max(right[0], right[1]))
        }
        if (node.right) {
          withParentMatch = Math.max(withParentMatch, 1 + right[1] + Math.max(left[0], left[1]))
        }

        transitions.push(`node=${node.value}, free=${noParentMatch}, matchedWithChild=${withParentMatch}`)
        dryRows.push([`${node.value}`, `${noParentMatch}`, `${withParentMatch}`])
        return [noParentMatch, withParentMatch]
      }

      const [free, matched] = dfs(root)

      return {
        answerLabel: 'Maximum Matching Size',
        answerValue: `${Math.max(free, matched)}`,
        explanation: {
          recurrence: 'Tree DP with states: free(node) and matchedWithChild(node).',
          complexityTime: 'O(n)',
          complexitySpace: 'O(h)',
        },
        matrix: [values],
        transitions,
        dryRunHeaders: ['Node', 'Free', 'MatchedWithChild'],
        dryRunRows: clampRows(dryRows),
        estimatedRecCalls: Math.min(1_000_000_000, Math.pow(2, Math.max(1, values.length))),
        stateCount: values.length * 2,
        transitionCount: values.length,
        cppCode: `pair<int,int> dfs(TreeNode* u) {\n  if (!u) return {0, 0};\n  auto L = dfs(u->left), R = dfs(u->right);\n  int free = max(L.first, L.second) + max(R.first, R.second);\n  int match = 0;\n  if (u->left) match = max(match, 1 + L.second + max(R.first, R.second));\n  if (u->right) match = max(match, 1 + R.second + max(L.first, L.second));\n  return {free, match};\n}\nint maxMatching(TreeNode* root) {\n  auto p = dfs(root);\n  return max(p.first, p.second);\n}`,
        treeRoot: 'TM(root)',
      }
    }

    default:
      return {
        answerLabel: 'Result',
        answerValue: 'N/A',
        explanation: {
          recurrence: 'No solver available.',
          complexityTime: 'N/A',
          complexitySpace: 'N/A',
        },
        matrix: [[0]],
        transitions: ['Unsupported problem id'],
        dryRunHeaders: ['Info'],
        dryRunRows: [['Unsupported problem']],
        estimatedRecCalls: 1,
        stateCount: 1,
        transitionCount: 0,
        cppCode: '// Unsupported problem id',
        treeRoot: 'N/A',
      }
  }
}

function AdvancedDPProblems({ problemId, title, onNavigate }: Props) {
  const [problemView, setProblemView] = useState<ProblemView>('visual')
  const [visualMode, setVisualMode] = useState<VisualMode>('dp')
  const [showExplanation, setShowExplanation] = useState(true)
  const [inputRaw, setInputRaw] = useState(defaultsByProblem[problemId] ?? '')
  const [transitionCursor, setTransitionCursor] = useState(0)
  const [isTransitionPlaying, setIsTransitionPlaying] = useState(false)
  const [transitionSpeedMs, setTransitionSpeedMs] = useState(900)

  const result = useMemo(() => solveProblem(problemId, inputRaw), [problemId, inputRaw])
  const codeVariants = ADVANCED_DP_CPP_VARIANTS[problemId]
  const treeGraph = useMemo(() => buildStaticTreeGraph(result.treeRoot, result.answerValue), [result.treeRoot, result.answerValue])
  const isTransitionComplete = result.transitions.length > 0 && transitionCursor >= result.transitions.length - 1

  const ratio = formatRatio(result.estimatedRecCalls, result.stateCount)

  // Find current problem index and determine previous/next
  const currentIndex = PROBLEM_SEQUENCE.indexOf(problemId as ProblemId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < PROBLEM_SEQUENCE.length - 1
  const previousProblemId = problemId === 'knapsack-01'
    ? 'edit-distance'
    : hasPrevious
      ? PROBLEM_SEQUENCE[currentIndex - 1]
      : null
  const nextProblemId = hasNext ? PROBLEM_SEQUENCE[currentIndex + 1] : null

  useEffect(() => {
    setTransitionCursor(0)
    setIsTransitionPlaying(false)
  }, [problemId, inputRaw, result.transitions.length])

  useEffect(() => {
    if (!isTransitionPlaying || result.transitions.length === 0) return
    if (isTransitionComplete) {
      setIsTransitionPlaying(false)
      return
    }

    const timer = window.setTimeout(() => {
      setTransitionCursor((prev) => Math.min(prev + 1, result.transitions.length - 1))
    }, transitionSpeedMs)

    return () => window.clearTimeout(timer)
  }, [isTransitionPlaying, isTransitionComplete, result.transitions.length, transitionSpeedMs])

  return (
    <article className="dp-problem-card" id="dp-problem-advanced">
      <div className="dp-problem-header">
        <h3>{title}</h3>
        <span className="dp-problem-tag">Fully Implemented</span>
      </div>

      <div className="dp-problem-nav-row">
        <button 
          type="button" 
          className="dp-problem-nav-btn" 
          disabled={!hasPrevious}
          onClick={() => previousProblemId && onNavigate(previousProblemId)}
        >
          Previous Problem
        </button>
        <button 
          type="button" 
          className="dp-problem-nav-btn" 
          disabled={!hasNext}
          onClick={() => nextProblemId && onNavigate(nextProblemId)}
        >
          Next Problem
        </button>
      </div>

      <p className="dp-problem-description">
        Input format: use problem-specific defaults, then edit and observe DP states, compare mode, recursion tree, dry run, and C++ reference.
      </p>

      <section className="dp-explanation" aria-label="Advanced DP explanation">
        <div className="dp-explanation-header">
          <h4>Explanation</h4>
          <button type="button" className="dp-explain-toggle" onClick={() => setShowExplanation((prev) => !prev)}>
            {showExplanation ? 'Hide' : 'Show'}
          </button>
        </div>
        {showExplanation && (
          <div className="dp-explanation-grid">
            <article className="dp-explanation-card">
              <h5>Recurrence</h5>
              <p>{result.explanation.recurrence}</p>
            </article>
            <article className="dp-explanation-card">
              <h5>Complexity</h5>
              <p>Time: {result.explanation.complexityTime}</p>
              <p>Space: {result.explanation.complexitySpace}</p>
            </article>
          </div>
        )}
      </section>

      <div className="dp-view-toggle" role="tablist" aria-label="Advanced problem view">
        <button
          type="button"
          className={`dp-view-btn ${problemView === 'visual' ? 'active' : ''}`}
          onClick={() => setProblemView('visual')}
          aria-selected={problemView === 'visual'}
        >
          Visual Walkthrough
        </button>
        <button
          type="button"
          className={`dp-view-btn ${problemView === 'cpp' ? 'active' : ''}`}
          onClick={() => setProblemView('cpp')}
          aria-selected={problemView === 'cpp'}
        >
          C++ Solution
        </button>
      </div>

      {problemView === 'visual' ? (
        <>
          <div className="dp-problem-controls">
            <label htmlFor="advanced-input">Problem Input</label>
            <input
              id="advanced-input"
              type="text"
              className="dp-text-input"
              value={inputRaw}
              onChange={(e) => setInputRaw(e.target.value)}
            />
          </div>

          <div className="dp-answer">
            <span>{result.answerLabel}:</span>
            <strong>{result.answerValue}</strong>
          </div>

          <div className="dp-mode-toggle" role="tablist" aria-label="Advanced visualization mode">
            <button
              type="button"
              className={`dp-mode-btn ${visualMode === 'dp' ? 'active' : ''}`}
              onClick={() => setVisualMode('dp')}
              aria-selected={visualMode === 'dp'}
            >
              DP Mode
            </button>
            <button
              type="button"
              className={`dp-mode-btn ${visualMode === 'compare' ? 'active' : ''}`}
              onClick={() => setVisualMode('compare')}
              aria-selected={visualMode === 'compare'}
            >
              Recursion vs DP
            </button>
            <button
              type="button"
              className={`dp-mode-btn ${visualMode === 'tree' ? 'active' : ''}`}
              onClick={() => setVisualMode('tree')}
              aria-selected={visualMode === 'tree'}
            >
              Recursion Tree
            </button>
            <button
              type="button"
              className={`dp-mode-btn ${visualMode === 'dryrun' ? 'active' : ''}`}
              onClick={() => setVisualMode('dryrun')}
              aria-selected={visualMode === 'dryrun'}
            >
              Dry Run
            </button>
          </div>

          {visualMode === 'compare' && (
            <div className="dp-compare-panel">
              <div className="dp-compare-cards">
                <div className="dp-compare-card recursion">
                  <h5>Naive Recursion</h5>
                  <p>Estimated raw calls</p>
                  <strong>{result.estimatedRecCalls >= 1_000_000_000 ? '1B+' : result.estimatedRecCalls}</strong>
                </div>
                <div className="dp-compare-card dynamic">
                  <h5>Dynamic Programming</h5>
                  <p>States + transitions used</p>
                  <strong>{result.stateCount} states / {result.transitionCount} transitions</strong>
                </div>
                <div className="dp-compare-card highlight">
                  <h5>Efficiency Gain</h5>
                  <p>Approx call-to-state ratio</p>
                  <strong>{ratio}x</strong>
                </div>
              </div>
            </div>
          )}

          {visualMode === 'tree' && (
            <section className="dp-recursion-tree-section" aria-label="Advanced recursion tree">
              <div className="dp-recursion-tree-header">
                <h4>Recursion Tree (Simplified)</h4>
                <span>Root: {result.treeRoot} | Nodes: {treeGraph.nodes.length}</span>
              </div>
              <div className="dp-recursion-context">
                <span className="ctx root">Root</span>
                <span className="ctx internal">Internal</span>
                <span className="ctx leaf">Leaf / Base</span>
                <span className="ctx left">Left branch</span>
                <span className="ctx right">Right branch</span>
                <span className="ctx value">Node value uses DP summary</span>
              </div>
              <div className="dp-recursion-tree-canvas">
                <svg className="dp-recursion-svg" viewBox={`0 0 ${treeGraph.width} ${treeGraph.height}`}>
                  {treeGraph.edges.map((edge) => (
                    <line
                      key={edge.id}
                      className={`dp-recursion-edge ${edge.side}`}
                      x1={edge.fromX}
                      y1={edge.fromY}
                      x2={edge.toX}
                      y2={edge.toY}
                    />
                  ))}
                  {treeGraph.nodes.map((node) => (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                      <circle className={`dp-recursion-node ${node.root ? 'root' : ''} ${node.leaf ? 'leaf' : 'internal'}`} r="15" />
                      <text className="dp-recursion-node-label" textAnchor="middle" dominantBaseline="middle">
                        {node.label}
                      </text>
                      <text className="dp-recursion-node-value" textAnchor="middle" y="26">
                        {node.valueText}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </section>
          )}

          <div className="dp-matrix-wrap" aria-label="Advanced DP matrix">
            <table className="dp-matrix-table">
              <tbody>
                {result.matrix.map((row, rIdx) => (
                  <tr key={`adv-r-${rIdx}`}>
                    {row.map((value, cIdx) => (
                      <td key={`adv-c-${rIdx}-${cIdx}`}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visualMode === 'dryrun' && (
            <div className="dp-dry-run">
              <div className="dp-dry-run-header">
                <h4>Detailed Dry Run</h4>
                <span>Showing first {result.dryRunRows.length} rows</span>
              </div>
              <div className="dp-dry-run-table-wrap">
                <table className="dp-dry-run-table">
                  <thead>
                    <tr>
                      {result.dryRunHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.dryRunRows.map((row, idx) => (
                      <tr key={`adv-row-${idx}`} className="dp-dry-run-row done">
                        {row.map((cell, cellIdx) => (
                          <td key={`adv-cell-${idx}-${cellIdx}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="dp-transition-player">
            <div className="dp-transition-player-header">
              <h4>Transition Playback</h4>
              <div className="dp-transition-meta">
                <span>{Math.min(transitionCursor + 1, result.transitions.length)}/{result.transitions.length || 0} steps</span>
                <span>{transitionSpeedMs}ms</span>
              </div>
            </div>

            <div className="dp-transition-status">
              <strong>
                {result.transitions.length === 0
                  ? 'No transitions available'
                  : isTransitionComplete
                    ? `Computed all ${result.transitions.length} transitions`
                    : `Computing/Evaluating transition ${Math.min(transitionCursor + 1, result.transitions.length)} of ${result.transitions.length}`}
              </strong>
              <span>
                {result.transitions.length === 0
                  ? '0% complete'
                  : `${Math.round((Math.min(transitionCursor + 1, result.transitions.length) / result.transitions.length) * 100)}% complete`}
              </span>
            </div>

            <div className="dp-transition-progress">
              <input
                type="range"
                min="0"
                max={Math.max(0, result.transitions.length - 1)}
                value={Math.min(transitionCursor, Math.max(0, result.transitions.length - 1))}
                onChange={(e) => {
                  setIsTransitionPlaying(false)
                  setTransitionCursor(Number(e.target.value))
                }}
                disabled={result.transitions.length === 0}
                aria-label="Transition progress"
              />
            </div>

            <div className="dp-transition-controls">
              <button
                type="button"
                className="dp-problem-nav-btn"
                onClick={() => {
                  setIsTransitionPlaying(false)
                  setTransitionCursor(0)
                }}
                disabled={result.transitions.length === 0 || transitionCursor === 0}
              >
                Start
              </button>
              <button
                type="button"
                className="dp-problem-nav-btn"
                onClick={() => {
                  setIsTransitionPlaying(false)
                  setTransitionCursor((prev) => Math.max(0, prev - 1))
                }}
                disabled={result.transitions.length === 0 || transitionCursor === 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="dp-problem-nav-btn dp-play-btn"
                onClick={() => {
                  if (isTransitionComplete && result.transitions.length > 0) {
                    setTransitionCursor(0)
                    setIsTransitionPlaying(true)
                    return
                  }
                  if (isTransitionPlaying) {
                    setIsTransitionPlaying(false)
                  } else {
                    setIsTransitionPlaying(true)
                  }
                }}
                disabled={result.transitions.length === 0}
              >
                {isTransitionPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="dp-problem-nav-btn"
                onClick={() => {
                  setTransitionCursor((prev) => Math.min(result.transitions.length - 1, prev + 1))
                }}
                disabled={result.transitions.length === 0 || isTransitionComplete}
              >
                Next
              </button>
              <button
                type="button"
                className="dp-problem-nav-btn"
                onClick={() => {
                  setIsTransitionPlaying(false)
                  setTransitionCursor(Math.max(0, result.transitions.length - 1))
                }}
                disabled={result.transitions.length === 0 || isTransitionComplete}
              >
                End
              </button>

              <label className="dp-transition-speed-label" htmlFor="advanced-transition-speed">Speed</label>
              <select
                id="advanced-transition-speed"
                className="dp-text-input dp-transition-speed-select"
                value={transitionSpeedMs}
                onChange={(e) => setTransitionSpeedMs(Number(e.target.value))}
              >
                <option value={1300}>Slow</option>
                <option value={900}>Normal</option>
                <option value={550}>Fast</option>
              </select>
            </div>
          </div>

          <div className="dp-transitions">
            <h4>State Transitions</h4>
            <ul>
              {result.transitions.slice(0, Math.min(transitionCursor + 1, result.transitions.length)).map((line, idx) => (
                <li key={`${idx}-${line}`} className={idx === Math.min(transitionCursor, result.transitions.length - 1) ? 'active' : ''}>{line}</li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="dp-code-stack" aria-label="Advanced C plus plus solution">
          <section className="dp-code-section">
            <h4>C++ Tabulation (Bottom-Up)</h4>
            <div className="dp-code-block">
              <pre>{codeVariants?.tabulation ?? result.cppCode}</pre>
            </div>
          </section>
          <section className="dp-code-section">
            <h4>C++ Memoization (Top-Down)</h4>
            <div className="dp-code-block">
              <pre>{codeVariants?.memoization ?? '// Memoization variant coming soon.'}</pre>
            </div>
          </section>
        </div>
      )}
    </article>
  )
}

export default AdvancedDPProblems
