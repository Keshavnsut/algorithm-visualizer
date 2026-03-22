#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int solve(int n, vector<int>& memo) {
        if (n <= 1) return 1;
        if (memo[n] != -1) return memo[n];

        memo[n] = solve(n - 1, memo) + solve(n - 2, memo);
        return memo[n];
    }

    int climbStairsMemo(int n) {
        vector<int> memo(n + 1, -1);
        return solve(n, memo);
    }
};

int main() {
    Solution sol;
    int n = 6;
    cout << "Ways for " << n << " steps = " << sol.climbStairsMemo(n) << endl;
    return 0;
}
