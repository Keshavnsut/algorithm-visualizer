#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int solve(int idx, const vector<int>& nums, vector<int>& memo) {
        if (idx < 0) return 0;
        if (idx == 0) return nums[0];
        if (memo[idx] != -1) return memo[idx];

        int skip = solve(idx - 1, nums, memo);
        int take = nums[idx] + solve(idx - 2, nums, memo);
        memo[idx] = max(skip, take);
        return memo[idx];
    }

    int rob(vector<int>& nums) {
        if (nums.empty()) return 0;
        vector<int> memo(nums.size(), -1);
        return solve(static_cast<int>(nums.size()) - 1, nums, memo);
    }
};

int main() {
    Solution sol;
    vector<int> nums = {2, 7, 9, 3, 1};
    cout << "Max loot = " << sol.rob(nums) << endl;
    return 0;
}
