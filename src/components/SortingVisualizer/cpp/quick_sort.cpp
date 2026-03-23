#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;

enum class PivotStrategy {
    First,
    Last,
    Random,
    MedianOfThree
};

static int choosePivotIndex(const vector<int>& arr, int low, int high, PivotStrategy strategy) {
    if (strategy == PivotStrategy::First) {
        return low;
    }
    if (strategy == PivotStrategy::Random) {
        return low + (rand() % (high - low + 1));
    }
    if (strategy == PivotStrategy::MedianOfThree) {
        int mid = low + (high - low) / 2;
        int a = arr[low];
        int b = arr[mid];
        int c = arr[high];

        if ((a <= b && b <= c) || (c <= b && b <= a)) return mid;
        if ((b <= a && a <= c) || (c <= a && a <= b)) return low;
        return high;
    }
    return high;
}

static int partition(vector<int>& arr, int low, int high, PivotStrategy strategy) {
    int pivotIndex = choosePivotIndex(arr, low, high, strategy);
    swap(arr[pivotIndex], arr[high]);

    int pivot = arr[high];
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }

    swap(arr[i + 1], arr[high]);
    return i + 1;
}

static void quickSortImpl(vector<int>& arr, int low, int high, PivotStrategy strategy) {
    if (low >= high) return;

    int pivotPos = partition(arr, low, high, strategy);
    quickSortImpl(arr, low, pivotPos - 1, strategy);
    quickSortImpl(arr, pivotPos + 1, high, strategy);
}

void quickSort(vector<int>& arr, PivotStrategy strategy = PivotStrategy::Last) {
    if (arr.empty()) return;
    quickSortImpl(arr, 0, static_cast<int>(arr.size()) - 1, strategy);
}
