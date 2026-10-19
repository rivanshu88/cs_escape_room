import type { EscapeCampaign, EscapeLanguage } from "./types";

export const ESCAPE_CAMPAIGNS: Record<EscapeLanguage, EscapeCampaign> = {
  cpp: {
    language: "cpp",
    label: "C++",
    description: "LOW-LEVEL CONTROL // MEMORY // ALGORITHMS",
    campaignTitle: "THE RED PROTOCOL",
    campaignSubtitle: "A control system is failing from the inside.",
    editorLanguage: "cpp",
    stages: [
      {
        id: "cpp-entry",
        title: "The Corrupted Entry Point",
        briefing: "The facility's intake routine reads a list of sensor values. The final reading never reaches the control system.",
        failure: "The scan stops one position before the end of the vector.",
        objective: "Make the loop inspect every value, including the last valid index.",
        starterCode: `int total = 0;
for (int i = 0; i < values.size() - 1; ++i) {
    total += values[i];
}`,
        faultyLine: "for (int i = 0; i < values.size() - 1; ++i) {",
        repairLine: "for (int i = 0; i < values.size(); ++i) {",
        evidence: ["TRACE 01 // indices: 0, 1, 2", "TRACE 02 // vector size: 4", "ALERT // index 3 was never inspected"],
        hints: ["Compare the last legal index with the current loop bound.", "The loop condition must include the final index when the size is four."],
        successMessage: "ENTRY POINT RESTORED. The intake relay now sees every reading.",
        nextBriefing: "The intake is stable, but every request leaves an allocated buffer behind. The memory monitor is climbing.",
      },
      {
        id: "cpp-memory",
        title: "Memory Leak",
        briefing: "A diagnostic routine allocates a buffer for each request. The buffer is no longer needed after the summary is written.",
        failure: "Repeated requests accumulate unused allocations.",
        objective: "Release the dynamically allocated array after it is used.",
        starterCode: `int* buffer = new int[count];
writeSummary(buffer, count);
// release the array here`,
        faultyLine: "// release the array here",
        repairLine: "delete[] buffer;",
        evidence: ["ALLOCATIONS // 128", "RELEASES // 0", "NOTE // buffer was allocated with new[]"],
        hints: ["The buffer is an array allocation, not a single object.", "Use the matching C++ array deallocation form."],
        successMessage: "MEMORY USAGE NORMALIZED. The control system can reclaim its buffers.",
        nextBriefing: "Memory has returned to baseline. The facility's sorted access index now fails to advance on some searches.",
      },
      {
        id: "cpp-index",
        title: "The Broken Data Structure",
        briefing: "The access index uses binary search. When a middle value is too small, that position has already been ruled out.",
        failure: "The lower bound can remain unchanged and the search stalls.",
        objective: "Advance the lower bound beyond the inspected midpoint.",
        starterCode: `if (values[mid] < target) {
    low = mid;
} else {
    high = mid - 1;
}`,
        faultyLine: "low = mid;",
        repairLine: "low = mid + 1;",
        evidence: ["TRACE // low=4 high=5 mid=4", "TRACE // next low=4 high=5 mid=4", "ALERT // search interval did not shrink"],
        hints: ["The midpoint was compared already.", "Move low to the first index after mid."],
        successMessage: "INDEX REPAIRED. Search intervals now shrink on every pass.",
        nextBriefing: "The index is responsive. Under load, two workers still update the same shared counter without coordination.",
      },
      {
        id: "cpp-race",
        title: "The Race Condition",
        briefing: "Two worker threads increment a shared counter. The lab simulation detects that an update can be interleaved.",
        failure: "A read-modify-write sequence is not atomic when performed concurrently.",
        objective: "Guard the critical section with the existing mutex.",
        starterCode: `std::mutex counterMutex;
int counter = 0;
void increment() {
    // missing lock
    counter++;
}`,
        faultyLine: "// missing lock",
        repairLine: "std::lock_guard<std::mutex> lock(counterMutex);",
        evidence: ["WORKER A // reads 10", "WORKER B // reads 10", "WORKER A // writes 11", "WORKER B // writes 11 // one update lost"],
        hints: ["Both workers need exclusive access to the whole update.", "Use RAII to hold the mutex for the function's critical section."],
        successMessage: "WORKERS SYNCHRONIZED. Shared updates are now protected.",
        nextBriefing: "The race is contained. A final integrity check must confirm the repaired intake, memory, index, and worker safeguards.",
      },
      {
        id: "cpp-root",
        title: "Root Access",
        briefing: "The final gate receives the repaired subsystem signals. It should grant access only when every integrity condition is true.",
        failure: "The gate currently accepts a request even when the memory integrity check fails.",
        objective: "Require authentication, a valid checksum, and intact memory before granting access.",
        starterCode: `bool authenticated = true;
bool checksumOk = true;
bool memoryIntact = false;
if (authenticated && checksumOk) {
    return ACCESS_GRANTED;
}`,
        faultyLine: "if (authenticated && checksumOk) {",
        repairLine: "if (authenticated && checksumOk && memoryIntact) {",
        evidence: ["AUTHENTICATION // valid", "CHECKSUM // valid", "MEMORY INTEGRITY // failed", "GATE // incorrectly granted access"],
        hints: ["The gate must consider every subsystem signal.", "Add the memory-integrity condition to the access predicate."],
        successMessage: "ROOT ACCESS GRANTED. THE RED PROTOCOL is stable.",
        nextBriefing: "All five C++ subsystems were repaired in simulation. The facility is ready to release you.",
      },
    ],
  },
  python: {
    language: "python",
    label: "Python",
    description: "LOGIC CORE // AUTOMATION // INTELLIGENCE",
    campaignTitle: "THE GHOST IN THE PIPELINE",
    campaignSubtitle: "A research pipeline is quietly corrupting its own results.",
    editorLanguage: "python",
    stages: [
      {
        id: "python-ingestion",
        title: "The Broken Ingestion",
        briefing: "The pipeline reads sensor records line by line. A whitespace-only line is being treated as a real record.",
        failure: "Blank records reach the parser and shift every field after them.",
        objective: "Skip lines that contain only whitespace.",
        starterCode: `for line in stream:
    if line:
        records.append(parse(line))`,
        faultyLine: "if line:",
        repairLine: "if line.strip():",
        evidence: ["INPUT // '   '", "TRUTHINESS // non-empty string", "PARSER // received blank record"],
        hints: ["Whitespace characters still make a string truthy.", "Strip surrounding whitespace before testing whether the line is empty."],
        successMessage: "INGESTION CLEAN. Empty records no longer enter the pipeline.",
        nextBriefing: "The incoming data is clean. The next worker repeatedly follows a recursive signal and never reaches its stop condition.",
      },
      {
        id: "python-recursion",
        title: "The Recursive Trap",
        briefing: "A recursive countdown should stop at zero. Negative input currently continues decreasing forever.",
        failure: "The base case handles zero, but not values below zero.",
        objective: "Make the recursion stop for zero and negative values.",
        starterCode: `def countdown(n):
    if n == 0:
        return 0
    return 1 + countdown(n - 1)`,
        faultyLine: "if n == 0:",
        repairLine: "if n <= 0:",
        evidence: ["CALL // countdown(-1)", "CALL // countdown(-2)", "CALL // countdown(-3)", "STACK // growing"],
        hints: ["The failing input starts below the current base case.", "The stop condition should include every value at or below zero."],
        successMessage: "RECURSION CONTAINED. The worker now has a terminating base case.",
        nextBriefing: "The worker returns. A feature-normalization step now maps every dataset to the same value when its range is constant.",
      },
      {
        id: "python-dataset",
        title: "The Corrupted Dataset",
        briefing: "Min-max normalization divides by the range. A constant-valued column has a zero range and needs a defined result.",
        failure: "The normalizer divides by zero when all observations are equal.",
        objective: "Handle the zero-range case before the division.",
        starterCode: `def normalize(value, minimum, maximum):
    return (value - minimum) / (maximum - minimum)`,
        faultyLine: "return (value - minimum) / (maximum - minimum)",
        repairLine: "return 0.0 if maximum == minimum else (value - minimum) / (maximum - minimum)",
        evidence: ["MINIMUM // 7", "MAXIMUM // 7", "DENOMINATOR // 0", "OUTPUT // division error"],
        hints: ["Check the denominator before dividing.", "When the minimum equals the maximum, return a stable neutral value."],
        successMessage: "DATASET STABLE. Constant columns no longer crash normalization.",
        nextBriefing: "Features now normalize safely. The evaluation report still looks impossibly perfect because it reads the answer instead of predicting it.",
      },
      {
        id: "python-prediction",
        title: "The False Prediction",
        briefing: "The evaluation loop receives feature rows and their labels. Its prediction output must come from the model, not from the answer key.",
        failure: "The reported score is contaminated by copying each true label into the predictions.",
        objective: "Ask the fitted model for a prediction using the feature row.",
        starterCode: `predictions = []
for features, label in test_rows:
    predictions.append(label)
score = accuracy(test_labels, predictions)`,
        faultyLine: "predictions.append(label)",
        repairLine: "predictions.append(model.predict(features))",
        evidence: ["TEST LABEL // available to scorer", "PREDICTION // copied from test label", "ACCURACY // 1.00 // invalid evaluation"],
        hints: ["The true label belongs only in the scoring comparison.", "Generate the predicted value from the features and fitted model."],
        successMessage: "EVALUATION HONEST. Predictions no longer leak from the answer key.",
        nextBriefing: "The evaluation is trustworthy. The final pipeline check now combines input integrity, safe normalization, and independent predictions.",
      },
      {
        id: "python-pipeline",
        title: "The Final Pipeline",
        briefing: "The release pipeline must reject corrupted input before applying model inference. Its current guard checks only one of the required conditions.",
        failure: "The pipeline proceeds even if its normalized feature vector is invalid.",
        objective: "Require valid input and normalized features before predicting.",
        starterCode: `if input_valid:
    prediction = model.predict(features)
    publish(prediction)`,
        faultyLine: "if input_valid:",
        repairLine: "if input_valid and features_normalized:",
        evidence: ["INPUT VALID // true", "FEATURES NORMALIZED // false", "PUBLISH // incorrectly started"],
        hints: ["The publish path depends on two independent checks.", "Add the normalized-feature condition to the guard."],
        successMessage: "PIPELINE RESTORED. THE GHOST IN THE PIPELINE has been contained.",
        nextBriefing: "The five Python pipeline stages pass in simulation. The research system can return to standby.",
      },
    ],
  },
  java: {
    language: "java",
    label: "Java",
    description: "STRUCTURED SYSTEMS // OBJECTS // EXECUTION",
    campaignTitle: "THE MACHINE THAT FORGOT",
    campaignSubtitle: "A structured execution environment is losing its invariants.",
    editorLanguage: "java",
    stages: [
      {
        id: "java-object",
        title: "The Missing Object",
        briefing: "A device registry constructs a controller, then immediately asks it to report its status.",
        failure: "The controller reference is declared but never initialized.",
        objective: "Create the controller before invoking its method.",
        starterCode: `Controller controller = null;
String status = controller.status();`,
        faultyLine: "Controller controller = null;",
        repairLine: "Controller controller = new Controller();",
        evidence: ["REFERENCE // null", "CALL // controller.status()", "EXCEPTION // NullPointerException"],
        hints: ["A declared reference does not create an object.", "Construct an instance of Controller before using it."],
        successMessage: "CONTROLLER INITIALIZED. The registry can read subsystem status.",
        nextBriefing: "The controller responds. Its inherited authorization method is now selecting the wrong rule for a restricted request.",
      },
      {
        id: "java-inheritance",
        title: "The Inheritance Conflict",
        briefing: "A restricted controller inherits a permissive default. Its override must reject requests without the required role.",
        failure: "The override returns true even when the role check fails.",
        objective: "Return the actual result of the role check.",
        starterCode: `class RestrictedController extends Controller {
    @Override
    boolean canAccess(User user) {
        return true;
    }
}`,
        faultyLine: "return true;",
        repairLine: "return user.hasRole(\"operator\");",
        evidence: ["USER ROLE // guest", "OVERRIDE // canAccess()", "ACCESS // granted"],
        hints: ["The override should not ignore its user argument.", "Return the result of checking for the operator role."],
        successMessage: "OVERRIDE CORRECTED. Restricted access now follows the role rule.",
        nextBriefing: "Authorization is behaving. The event history collection still skips every second entry while being traversed.",
      },
      {
        id: "java-collection",
        title: "The Collection Failure",
        briefing: "The archive printer walks a list of events using a fixed step of two.",
        failure: "Every other event is silently omitted from the archive.",
        objective: "Advance the list index by one for every event.",
        starterCode: `for (int i = 0; i < events.size(); i += 2) {
    archive(events.get(i));
}`,
        faultyLine: "for (int i = 0; i < events.size(); i += 2) {",
        repairLine: "for (int i = 0; i < events.size(); i++) {",
        evidence: ["EVENTS // [0, 1, 2, 3]", "VISITED // [0, 2]", "MISSING // [1, 3]"],
        hints: ["Compare the visited indices with the full list.", "Move the iteration index forward by one rather than two."],
        successMessage: "ARCHIVE COMPLETE. Every event is now recorded once.",
        nextBriefing: "The archive is complete. Two worker threads can still overwrite one another's updates to the shared count.",
      },
      {
        id: "java-concurrency",
        title: "The Concurrency Incident",
        briefing: "Two threads call increment on the same counter. The compound update must be protected as one operation.",
        failure: "Both threads can read the same value before either writes its increment.",
        objective: "Synchronize the method so only one thread updates the counter at a time.",
        starterCode: `class SharedCounter {
    private int count = 0;
    public void increment() {
        count++;
    }
}`,
        faultyLine: "public void increment() {",
        repairLine: "public synchronized void increment() {",
        evidence: ["THREAD A // reads 4", "THREAD B // reads 4", "THREAD A // writes 5", "THREAD B // writes 5"],
        hints: ["The increment includes a read and a write.", "Use Java's synchronized method modifier to serialize this update."],
        successMessage: "COUNTER SYNCHRONIZED. The lost update is prevented.",
        nextBriefing: "The shared counter is stable. The recovery gate must now require initialized, authorized, archived, and synchronized subsystems.",
      },
      {
        id: "java-recovery",
        title: "The Final Recovery",
        briefing: "The final recovery gate should open only when all four subsystem checks have passed.",
        failure: "The current gate ignores the archive and concurrency checks.",
        objective: "Require every subsystem signal before returning a recovered state.",
        starterCode: `if (controllerReady && accessAllowed) {
    return State.RECOVERED;
}`,
        faultyLine: "if (controllerReady && accessAllowed) {",
        repairLine: "if (controllerReady && accessAllowed && archiveComplete && counterSynchronized) {",
        evidence: ["CONTROLLER // ready", "ACCESS // allowed", "ARCHIVE // incomplete", "COUNTER // unsynchronized", "GATE // opened too early"],
        hints: ["The gate depends on all four subsystems.", "Add both missing subsystem flags to the condition."],
        successMessage: "RECOVERY COMPLETE. THE MACHINE THAT FORGOT is stable again.",
        nextBriefing: "All five Java subsystems pass their deterministic simulation checks. The machine is ready to release the session.",
      },
    ],
  },
};

export const ESCAPE_LANGUAGES = Object.values(ESCAPE_CAMPAIGNS);
