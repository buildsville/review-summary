"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
function getReview() {
    return __awaiter(this, void 0, void 0, function () {
        var payload, pullRequest, repository, owner, pullNumber, repo, client, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = github.context.payload;
                    pullRequest = payload.pull_request;
                    repository = payload.repository;
                    if (pullRequest == undefined || repository == undefined) {
                        return [2 /*return*/];
                    }
                    owner = repository.owner.login;
                    pullNumber = pullRequest.number;
                    repo = repository.name;
                    client = new github.GitHub(core.getInput('token'));
                    return [4 /*yield*/, client.pulls.listReviews({
                            owner: owner,
                            pull_number: pullNumber,
                            repo: repo
                        })["catch"](function (e) { return core.setFailed(e.message); })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
function summary(review) {
    var data = review.data;
    var summary = data.map(function (d) { return ({
        state: d.state,
        user: d.user.login,
        submitted_at: Date.parse(d.submitted_at)
    }); });
    var eachUser = {};
    var states = [];
    summary.forEach(function (s) {
        if (!eachUser[s.user]) {
            eachUser[s.user] = {
                state: s.state,
                time: s.submitted_at
            };
        }
        else {
            if (eachUser[s.user].time < s.submitted_at) {
                eachUser[s.user] = {
                    state: s.state,
                    time: s.submitted_at
                };
            }
        }
    });
    Object.keys(eachUser).forEach(function (u) {
        states.push(eachUser[u].state);
    });
    return states;
}
function aggregate(arr) {
    var approve = arr.filter(function (s) { return s == "APPROVED"; }).length;
    var requestCanges = arr.filter(function (s) { return s == "CHANGES_REQUESTED"; }).length;
    var comment = arr.filter(function (s) { return s == "COMMENTED"; }).length;
    var pending = arr.filter(function (s) { return s == "PENDING"; }).length;
    var result = {
        approved: approve.toString(),
        commented: comment.toString(),
        changes_requested: requestCanges.toString(),
        pending: pending.toString(),
        url: getHtmlUrl()
    };
    return result;
}
function output(result) {
    core.setOutput('approved', result.approved);
    core.setOutput('changes_requested', result.changes_requested);
    core.setOutput('commented', result.commented);
    core.setOutput('pending', result.pending);
    core.setOutput('url', result.url);
}
function getHtmlUrl() {
    var payload = github.context.payload;
    if (payload.pull_request == undefined) {
        return "";
    }
    if (payload.pull_request.html_url == undefined) {
        return "";
    }
    return payload.pull_request.html_url;
}
function outputLabels() {
    var pr = github.context.payload.pull_request;
    if (pr == undefined) {
        return;
    }
    var labels = pr.labels.map(function (label) { return label.name; });
    labels.forEach(function (label) {
        core.setOutput(label, "true");
    });
}
var reviews = getReview();
reviews.then(function (rev) {
    var sum = summary(rev);
    var agg = aggregate(sum);
    output(agg);
});
outputLabels();
