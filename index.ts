import * as core from '@actions/core'
import * as github from '@actions/github'

type Status = {
    state: string
    user: string
    submitted_at: number
}

type Result = {
    approved: string
    commented: string
    changes_requested: string
    pending: string
    url: string
}

function getPullRequestOwner():string {
    let pullRequest = github.context.payload.pull_request 
    if ( pullRequest == undefined ) {
        return ""
    }
    return pullRequest.user.login
}

async function getReview() {
    let payload = github.context.payload
    let pullRequest = payload.pull_request 
    let repository = payload.repository
    if ( pullRequest == undefined || repository == undefined ) {
        return
    }
    let owner = repository.owner.login
    let pullNumber = pullRequest.number
    let repo = repository.name
    let client = github.getOctokit(core.getInput('token'))
    let result = await client.rest.pulls.listReviews({
        owner: owner,
        pull_number: pullNumber,
        repo: repo
    }).catch(
        e => core.setFailed(e.message)
    )
    return result
}

function summary(review: any):Array<string> {
    let data = review.data
    let summary = data.map(
        d => <Status>{
            state: d.state,
            user: d.user.login,
            submitted_at: Date.parse(d.submitted_at)
        }
    )
    let summayExceptPrOwner = summary.filter(
        d => d.user !== PrOwner
    )

    let eachUser = {}
    let states = Array()

    summayExceptPrOwner.forEach( s => {
        if (!eachUser[s.user]) {
            eachUser[s.user] = {
                state: s.state,
                time: s.submitted_at
            }
        } else {
            if(eachUser[s.user].time < s.submitted_at ) {
                eachUser[s.user] = {
                    state: s.state,
                    time: s.submitted_at
                }
            }
        }
    })

    Object.keys(eachUser).forEach( u => {
        states.push(eachUser[u].state)
    })
    return states
}

function aggregate(arr: Array<string>):Result {
    let approve = arr.filter(
        s => s == "APPROVED"
    ).length
    let requestCanges = arr.filter(
        s => s == "CHANGES_REQUESTED"
    ).length
    let comment = arr.filter(
        s => s == "COMMENTED"
    ).length
    let pending = arr.filter(
        s => s == "PENDING"
    ).length
    let result: Result = {
        approved: approve.toString(),
        commented: comment.toString(),
        changes_requested: requestCanges.toString(),
        pending: pending.toString(),
        url: getHtmlUrl()
    }
    return result
}

function output(result: Result):void{
    core.setOutput('approved',result.approved)
    core.setOutput('changes_requested',result.changes_requested)
    core.setOutput('commented',result.commented)
    core.setOutput('pending',result.pending)
    core.setOutput('url',result.url)
}

function getHtmlUrl():string {
    let payload = github.context.payload
    if ( payload.pull_request == undefined ) {
        return ""
    }
    if (payload.pull_request.html_url == undefined) {
        return ""
    }
    return payload.pull_request.html_url
}

function outputLabels() {
    let pr = github.context.payload.pull_request
    if ( pr == undefined ) {
        return
    }
    let labels = pr.labels.map(label => label.name)
    labels.forEach(label => {
        core.setOutput(label,"true")
    });
}

outputLabels()
const PrOwner = getPullRequestOwner();
const reviews = getReview()
reviews.then(function(rev){
    const sum = summary(rev)
    const agg = aggregate(sum)
    output(agg)
})
