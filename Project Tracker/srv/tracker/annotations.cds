using {TrackerService} from './entities';

// The floor is what makes the handler's sum rule sound: a negative count could
// otherwise balance an over-total one.
annotate TrackerService.TestRuns with {
  total   @assert.range: [
    0,
    _
  ];
  passed  @assert.range: [
    0,
    _
  ];
  failed  @assert.range: [
    0,
    _
  ];
  pending @assert.range: [
    0,
    _
  ];
};
