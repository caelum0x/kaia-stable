# Dapp Starter

When you're new to Dapp development, it can be difficult to know where to begin. In such cases, the **Dapp Starter** can serve as a helpful starting point.

The Dapp Starter is a template that includes the essential features needed for building a Dapp. You can customize and build your own Dapp based on this template.\
This guide walks you through the Dapp Starter in the following steps:

* [What is the Dapp Starter? ](#what-is-the-dapp-starter)
* [How to get started with the Dapp Starter.](#how-to-get-started-with-the-dap-starter)
  * Environment setup
  * Downloading and running the source code
  * Deploying to a server
* [Key features of the Dapp Starter](#key-features-of-thedapp-starter)
  * Connect/disconnect wallet&#x20;
  * Crypto/fiat payment
  * KAIA/STRIPE conversion ratio
  * LIFF integration\\

## What is the Dapp Starter?

The **Dapp Starter** is a template project designed to help you easily integrate the `dapp-portal-sdk`. While you can always start your Dapp project from scratch, using this starter allows for a faster and smoother development experience.

It also follows a predefined design guide, which can help maintain consistency in UI/UX.

The project is built with **Next.js**. Even if you're planning to use a different framework, this repository can still serve as a useful reference for integrating the `dapp-portal-sdk`.\\

## How to get started with the Dapp Starter

### &#x20;Environment

The Dapp Starter requires **Node.js** to run. It uses `pnpm` as the package manager (compatible with `npm`).

* Recommended Node.js version: **>= 20.0.0**
* The version specified in `.nvmrc`: **v20.18.0**
* Older versions may work partially, but for compatibility with Netlify deployment tools, Node.js >= 20.0.0 is required.

\*Tip: Use [`nvm`](https://github.com/nvm-sh/nvm) to manage Node versions easily.

### Downloading and running the source code&#x20;

You can clone or fork the repository from GitHub:\
&#x20;<https://github.com/techreadiness/dapp-starter>

To run the project locally, follow the instructions in the repository’s `README.md`.

### Deploying to a server

Once you’ve run the Dapp Starter locally and verified that it's working, you can deploy it to a live server using **Netlify**:

<details>

<summary>A netlify account is required </summary>

[Netlify (opens new window)](https://www.netlify.com/)is a hosting service for static sites, open an account before deploying to Netlify. The content on this page can be run on Netlify's free plan.

</details>

<details>

<summary>.env.production file should be saved in Netlify setting.</summary>

Go to Project > Project Configuration > Environment Variables and save .env.production variables.&#x20;

</details>

```bash
# Go to the root directory
cd ./
# Build the project
npm build 
# Install netlify cli
npm install -g netlify-cli
# Login Nåetlify and connect repository with your netlify account
netlify login
# Deploy to a draft (preview) environment
netlify deploy
# Once verified, deploy to production
netlify deploy --prod 
```

The official published version is available at <https://dapp-starter.netlify.app>.

## Key features of the Dapp starter

The Dapp Starter comes with several basic features implemented out of the box.\
These demonstrate how to use core functionalities from `dapp-portal-sdk`, but should be treated as **reference code**, not a final solution.

### Connect/Disconnect wallet

Connecting and disconnecting a wallet is the most fundamental feature when using the SDK.\
In the code, you’ll find how to use `walletProvider` and its methods.\\

**reference code**\
[functions related to wallet connect and disconnect](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/components/Wallet/Sdk/walletSdk.hooks.ts#L58)

### Wallet Session Persistence

You can first check whether a login session exists by calling\
`walletProvider.request({ method: 'kaia_accounts' })`, so that the wallet session remains active after a user logs in once for convenience.\\

**reference code**\
[maintaining session using kaia\_accounts](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/app/page.tsx#L15)

### Crypto/Fiat payment

The template shows how to handle both **crypto** and **fiat** payments using `paymentProvider`.

You can see examples of:

* Creating paymentId
* Checking the payment status
* Finalizing the payment\\

**reference code**

[functions related to payment](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/components/Store/Sdk/paymentSdk.hooks.ts#L39)

### KAIA/STRIPE ratio

To support payments, your Dapp needs to apply proper price conversion logic between **crypto (KAIA)** and **fiat (STRIPE)**.\
The starter includes a `usd-to-kaia` function as a reference.\\

**reference code**\
[usd to kaia conversion](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/app/api/usd-to-kaia/route.ts#L3)

### KAIA/USDT balance

The template shows how to get balance of both kaia and erc20 based token.\
\
**reference code**\
[kaia balance](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/components/Wallet/Sdk/walletSdk.hooks.ts#L87)\
[erc20token balance](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/components/Wallet/Sdk/walletSdk.hooks.ts#L100)

### LIFF integration

If you're planning to integrate with **LINE Front-end Framework (LIFF)**, this project includes useful examples such as:

* When to initialize LIFF
* How to use methods like `shareTargetPicker`\
  \\

**reference code**

[liff initialization](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/components/Wallet/Sdk/walletSdk.hooks.ts#L38)\
[shareTargetPicker method](https://github.com/techreadiness/dapp-starter/blob/cf5227243e2d878effdc634cd83f27b75b5b65e5/src/components/Invitation/Invitation.hooks.ts#L4)
https://docs.dappportal.io/mini-dapp/mini-dapp-sdk
LINE's Mini Dapp & Dapp Portal
How to build successful Mini Dapp
Join Us
Contact Us
Kaia Wave: Builder Support Program
About Kaia
Qualifications and Requirements
Marketing Package
Developers Resources
Evaluation Criteria
FAQ
Mini Dapp
Overview
Sample Mini Dapp
Dapp Starter
LINE Integration
LINE Developers
LINE Front-end Framework (LIFF)
Essential Settings
Official Account
Invite Friends
Mini Dapp SDK
How to Get SDK Authorization
Initiate DappPortalSDK
Wallet
Domain Verification via Reown
Payment
Settlement
Policy
Release Note
Integration Guide for Game Engine
for Unity
for Cocos Creator
Design Guide
Dapp Portal
Mini Dapp Information
Collection & Drops
Collection Information
Upload NFT Information
Drops Information
Fungible Token Information
How to mint NFT
Update NFT Information
Reward
Reward System Flow
Policy
GRAC(South Korea)
Extra Packages
Gas Fee Delegation
Growth Competition
Playbook for Teams
Historical Data
Review Guidelines
Update Note