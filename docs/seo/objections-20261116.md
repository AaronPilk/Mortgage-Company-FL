# Broker objections research, 2026-11-16

Wholesale Mortgage Lending (wsmlending.com) only. Research behind the rewrite of
`/resources/how-mortgage-brokers-work` ("Is a Mortgage Broker Worth It? How
Brokers Work and Get Paid"). Everything below is paraphrased; no post is quoted
beyond a few words.

## How the threads were found

- The web search tool was asked the owner's queries
  (`site:reddit.com "mortgage broker" "waste of money"`, `... worth it`,
  `... vs bank regret`, `... fees scam`). It does not honour `site:` and
  returned no reddit.com URLs, only forums and blogs.
- reddit.com refuses automated requests (HTTP 403 to the JSON search endpoint,
  "site blocked" to the page fetcher), so no thread page or comment was read.
- Thread titles and opening posts came from the public Pullpush archive search
  (`api.pullpush.io/reddit/search/submission`), filtered to US subreddits and
  to posts that mention a broker. A follow-up request for the comment threads
  was refused by this session's permission policy and was not retried, so the
  objections below come from the opening posts only, not from replies.

## Objections that keep coming up

| #   | Objection (paraphrased)                                                                                                                   | Threads                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A broker is a middleman with a fee; going straight to a bank or credit union must be cheaper.                                             | r/RealEstate, 2015-12-18, https://www.reddit.com/r/RealEstate/comments/3xdw63/is_using_a_mortgage_broker_a_waste_of_money/ · r/Mortgages, 2017-04-20, https://www.reddit.com/r/Mortgages/comments/66hoyr/are_there_advantages_to_using_one_of_the_big/ · r/Mortgages, 2026-06-30, https://www.reddit.com/r/Mortgages/comments/1ujf2h0/is_it_worth_hiring_a_mortgage_broker_as_a_first/ |
| 2   | The broker's pay will be hidden in a higher rate.                                                                                         | r/Mortgages, 2025-11-08, https://www.reddit.com/r/Mortgages/comments/1os1wrh/obtaining_mortgage_from_uwm_united_wholesale/ · r/Mortgages, 2026-04-02, https://www.reddit.com/r/Mortgages/comments/1sa9fnh/california_7125_rate/                                                                                                                                                        |
| 3   | Fees were never discussed and then showed up in the disclosures, or look high (points on a non-QM loan).                                  | r/Mortgages, 2026-01-12, https://www.reddit.com/r/Mortgages/comments/1qb6gj1/switch_broker_or_ask_for_higher_discounts/ · r/Mortgages, 2026-05-21, https://www.reddit.com/r/Mortgages/comments/1tj9u4y/is_a_225_broker_fee_normal_for_a_584k_non_qm/                                                                                                                                   |
| 4   | The broker (or the builder's or agent's preferred lender) discourages shopping; people who did shop found better terms.                   | r/Mortgages, 2026-02-06, https://www.reddit.com/r/Mortgages/comments/1qxojuz/aus_preapproval_when_do_i_shop_rates/ · r/Mortgages, 2026-05-18, https://www.reddit.com/r/Mortgages/comments/1th44n2/first_time_buyer/ · r/Mortgages, 2026-04-30, https://www.reddit.com/r/Mortgages/comments/1szhjbe/shopped_mortgages_and_saved_big/                                                    |
| 5   | Once a broker has pulled credit, am I stuck with them, even if they're slow or don't communicate?                                         | r/FirstTimeHomeBuyer, 2026-07-11, https://www.reddit.com/r/FirstTimeHomeBuyer/comments/1utvizp/seek_multiple_mortgage_lenders/                                                                                                                                                                                                                                                         |
| 6   | Brokers rush people into things they don't understand; small brokers might be a scam.                                                     | r/FirstTimeHomeBuyer, 2025-07-01, https://www.reddit.com/r/FirstTimeHomeBuyer/comments/1lpb9zw/best_practices_for_buying_a_home/ · r/Mortgages, 2026-07-21, https://www.reddit.com/r/Mortgages/comments/1v2pw8q/how_ethical_is_my_job_as_a_mortgage_broker/                                                                                                                            |
| 7   | When does a broker add nothing? (a simple conventional loan, an employer relocation package tied to set lenders, comparing credit unions) | r/Mortgages, 2026-01-18, https://www.reddit.com/r/Mortgages/comments/1qgbwme/should_i_use_a_mortgage_broker_when_im_limited_in/ · r/Mortgages, 2026-05-12, https://www.reddit.com/r/Mortgages/comments/1tb6o67/when_should_you_shop_rates_and_evaluate/                                                                                                                                |

Counterweight, for honesty: some posters report a good result after being
skeptical (r/Mortgages, 2026-07-31,
https://www.reddit.com/r/Mortgages/comments/1vbrkqy/mortgage_broker/). One
recurring complaint, a broker talking someone into a smaller down payment with
PMI that then did not come off when expected
(https://www.reddit.com/r/Mortgages/comments/1ljec8g/anyone_with_expreience_removing_pmi_from_mortgage/),
is about PMI servicing rules and is already covered by `/resources/remove-pmi`.

## How the page answers each one, and on what source

| #   | Section on the page                                                                                       | Primary source                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Isn't a broker just a middleman adding a fee?"                                                           | CFPB, lender vs broker (en-130); CFPB, What is a Loan Estimate? (en-1995): one standard form for every lender                            |
| 2   | "Will the broker's pay push my rate up?"                                                                  | 12 CFR 1026.36(d)(1): pay may not be based on a term of the transaction; a fixed percentage of the loan amount is allowed                |
| 2   | "How do mortgage brokers get paid?"                                                                       | CFPB en-132 (salary, per-loan amount, percentage, minimums and maximums); 1026.36(d)(2) dual compensation; 1026.36(e)(1) anti-steering   |
| 3   | "Where does the broker's pay show up on my paperwork?"                                                    | 1026.37(f)(1) (Loan Estimate origination charges the consumer pays); 1026.38(f)(1) (Closing Disclosure shows creditor-paid compensation) |
| 3   | "What if the fees weren't explained up front?"                                                            | 1026.19(e)(1)(iii) three business days; 1026.19(e)(2)(i) no fee before the Loan Estimate and intent to proceed, except a credit report   |
| 4   | "My broker doesn't want me to shop around. Is that a red flag?"                                           | CFPB en-130 (shop around either way); CFPB en-2005 (45-day window); 1026.36(e)(2)-(3) safe harbor contents                               |
| 5   | "Am I stuck once a broker has pulled my credit?"                                                          | CFPB en-2005; 1026.19(e)(2)(i)                                                                                                           |
| 6   | "How do I check a broker before I start?" and the last bullet of "When is a broker not the right choice?" | CFPB en-133 (NMLS Consumer Access, state regulator); Florida Statutes ch. 494, s. 494.001(29) (the Office of Financial Regulation)       |
| 7   | "When is a broker not the right choice?"                                                                  | Conditional guidance only; no factual claim needing a source                                                                             |

Correction made on the way: the old page said broker compensation always
appears on the Loan Estimate. That is true only when the borrower pays the
broker. Lender-paid compensation is not a borrower charge on the Loan Estimate
and appears on the Closing Disclosure instead (1026.37(f)(1), 1026.38(f)(1)).
The old page also said retail pricing is often above the same lender's
wholesale channel, a savings claim with no primary source; it was removed.

Source texts were read on 2026-11-16: the eCFR renderer API for 12 CFR 1026.19,
1026.36, 1026.37 and 1026.38; the four CFPB Ask CFPB pages (last reviewed
between April 2024 and August 2026); flsenate.gov for chapter 494 and s.
494.001.
