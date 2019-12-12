# Review Summary

Summarize review state and set outputs.  
Aggregate latest review for each reviewer.

## Inputs

### token (required)

Usually set ${{ secret.GITHUB_TOKEN }}.  
Or set your personal access token.

## Outputs

### approved

Number of approves.

### commented

Number of comments.

### changes_requested

Number of change requests.

### pending

Number of pending.

## Example usage

```
on:
  pull_request_review:
    types:
      - submitted
jobs:
  test:
    runs-on: ubuntu-latest
    name: test
    steps:
      - name: review
        uses: buildsville/review-summary@v1
        id: summary
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: print review summary
        run: |
          echo "APPROVE: ${{ steps.summary.outputs.approved }}"
          echo "REQUEST_CHANGES: ${{ steps.summary.outputs.changes_requested }}"
          echo "COMMENT: ${{ steps.summary.outputs.commented }}"
          echo "PENDING: ${{ steps.summary.outputs.pending }}"
      - name: print if more than 2 approve
        if: steps.summary.outputs.approved > 2
        run: |
          echo "Got more than 2 approve!!!"
```
