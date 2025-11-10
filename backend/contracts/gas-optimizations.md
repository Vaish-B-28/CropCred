# Gas Optimization Notes

- Added `view` modifier to `getX()` for cheaper external reads.
- Indexed `sender` and `by` in `Increment` event for efficient log filtering.
- Avoided unnecessary storage writes — `x` is only updated when incremented.
- Used `require()` in `incBy()` to prevent invalid state changes and wasted gas.
