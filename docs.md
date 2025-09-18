How to build successful Mini Dapp
Featured on Dapp Portal
The more the Mini Dapp meets the following requirements during onboarding, the more likely it will be featured in the Dapp Portal and attract more users. Please be sure to adhere to the requirements while developing the Mini Dapp.

Requirements
Provision of services in various environments with Mini Dapp Connect
Clients must build Mini Dapp wtih two types of LINE and Web version. 


Web3.0 PvsZ | Mini Dapp
LINE version
LINE version can be built via LIFF SDK. Users can easily access your Mini Dapp through LINE Messenger without install or download application. Also, Users could invite their friends and create wallet with LINE account logged in.

We strongly recommend providing Wallet Connect only when needed, rather than on the initial screen, to reduce the drop rate of users accessing the LINE version. However, since wallet integration may be essential when offering rewards, it would be advisable to place the wallet integration button where it can be easily found.

User Flow : 
Access Mini Dapp(LIFF) -> Consent Channel -> Add OA -> Play Mini Dapp -> Wallet Connect (at neccessary steop e.g. payment, reward)


Web3.0 PvsZ | Mini Dapp
Web version
Mini Dapp must be build in Web version to users who does not familiar with LINE Messenger. Mini Dapp SDK provides integration of web environment including wallet connection via various social account, Kaia Wallet(Mobile App/Extension) and OKX Wallet.

In the case of the web version, Wallet Connect must be provided on the initial screen for account creation. Wallet Connect does not refer to LINE Login; it refers to wallet integration provided through the Mini Dapp SDK.

User Flow : 
Access Mini Dapp(Web) -> Wallet Connect -> Play Mini Dapp


Web3.0 PvsZ | Mini Dapp
Compatibility between LINE and Web version
The account system of the two versions of the Mini Dapp should operate based on the Wallet Address to ensure account compatibility between the two versions.

When connecting a wallet in the LIFF and Web version, if connection proceeds with Mini Dapp Wallet(LINE) or OKX Wallet, the Wallet Address will be the same across both versions, ensuring account information compatibility.
However, the Web version's Mini Dapp Wallet(Kaia Wallet App/Extension and Social logins excluding LINE) cannot be compatible with LIFF's.


For example, User A has created Mini Dapp Wallet via LINE Account 'a' from Web version, It is same with LIFF's if user logged in LINE Messenger with LINE Account 'a'.

Provision of In-app item store
Mini Dapp SDK provide payment solution both of Crypto($KAIA) and Fait(STRIPE). To create your revenue model, an in-app item store must be established.


Wizzwoods | Mini Dapp, Midnight Survivors | Mini Dapp
Provision of multi-language
Mini Dapp must provide English and Japanese for users as default. Other languages can be optional as your target country. Classification user country can be done in several ways. You can either follow the browser or system language settings set by the user or determine the country based on the accessed IP address, and based on this, you should provide the appropriate language.


Dapp Portal
Provision of Point Reward
Point rewards can enhance user loyalty. These points can be used as currency within the Mini Dapp and ultimately support exchanges with tokens issued by the Mini Dapp, providing a sense of economic benefit. This can lead to explosive growth for the Mini Dapp.


Bombie | Mini Dapp, Heroicarena | Mini Dapp, SuperZ | Mini Dapp
Provision of information about connected wallet
It is very important to make users aware of the information about the connected wallet on any screen of your Mini Dapp. Users may enjoy many Mini Dapps and want to connect different wallets for each. By providing intuitive information about which wallet is connected and what the balance is, you can enhance the convenience that leads to payments.


Elderglade | Mini Dapp
Wallet Type : getWalletType()

Wallet Address : kaia_accounts()

If it does not have connected wallet, use kaia_requestAccounts()

Wallet Balance : kaia_getBalance()

Provision of payment status
It is very important to inform users about the payment progress status. After starting the payment using the payment creation API, the payment is processed and completed through communication with the payment gateway (PG). If the payment completion and item distribution notifications are not appropriately provided on the user's screen, they may not be able to confirm whether the payment was completed. Once the payment starts, a UI that shows the payment status should be provided during the payment process, and upon receiving the payment completion webhook, the process of distributing the items should be displayed on the payment screen.


Elderglade | Mini Dapp
create payment API >

payment status > 

Guide for Mini Dapp based on Landscape Mode

Snake Online | Mini Dapp
If your Mini Dapp is optimized for landscape mode, please ensure that it operates in landscape mode even when the user's device is set to portrait mode. It should also function in landscape mode when the auto-rotate feature is used.

Add To Home Screen

Add to Home Screen | Dapp Portal
The Dapp Portal provides users with a shortcut to easily access the Mini Dapp on their mobile home screen.

"Add to Home Screen" feature is provided in two ways:

Available on the Mini Dapp detail screen within the Dapp Portal.

Provided by the Mini Dapp (the shortcut URL is provided by the Dapp Portal, and the Mini Dapp will develop a UI to integrate this URL).

Shortcut URL : https://www.dappportal.io/shortcut.html?dappId=dappId&register=1&&openExternalBrowser=1
*dappId: please find it on your bridge page urls or contact support channel if you don't have.
*register=1: required.
*openExternalBrowser=1: If opening urls from LIFF, it allow ot open in external browser.


Add to Home Screen provided by Mini Dapp
Provision of Maintenance Mode

Maintenance Mode | Sample
Please provide a maintenance screen during scheduled or emergency maintenance of the Mini Dapp to enhance user experience. In the absence of any notification during maintenance or inaccessibility, it may cause confusion among users.
It would be helpful to include the estimated end time and contact information for detailed updates on the maintenance screen.

Provision of Close Confirmation Dialog
If a user accidentally presses the back button while playing a MIni Dapp, the current progress may not be saved and the Mini Dapp could be closed unexpectedly. Displaying a confirmation popup when the page is about to be closed is recommended.



You can display a confirmation popup using the following code:

Example (React)
Insert the following code in your landing page or layout component:

Copy

useEffect(() => {
    const preventGoBack = () => {
        if(window.location.pathname === '/') {
            const isConfirmed = confirm('Are you sure you want to go back?');
            if (!isConfirmed) {
                history.pushState(null, '', window.location.pathname)
            }
        }
    };

    window.addEventListener('popstate', preventGoBack);

    // Remove listener when unmounted
    return () => {
        window.removeEventListener('popstate', preventGoBack);
    };
}, []);
Example (Vanilla JS - index.html)
Copy
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Back Button Blocker</title>
</head>
<body>
  <h1>Home</h1>

  <script>
    if (window.location.pathname === '/') {
      history.pushState(null, '', window.location.pathname);
    }

    function preventGoBack(event) {
      if (window.location.pathname === '/') {
        const isConfirmed = confirm('Are you sure you want to go back?');
        if (!isConfirmed) {
          history.pushState(null, '', window.location.pathname);
        }
      }
    }

    window.addEventListener('popstate', preventGoBack);

    window.addEventListener('beforeunload', () => {
      window.removeEventListener('popstate', preventGoBack);
    });
  </script>
</body>
</html>
Join Us
1. 📝 Get Mini Dapp SDK
Mini Dapp SDK
Getting started is simple. Just agree to and submit the Terms & Conditions, and your Mini Dapp SDK will be issued in approximately 3 days. SDK Credentials will be delivered to the email address you've submitted.

WalletProvider, one of the features provided in the Mini Dapp SDK, is available to anyone upon request. You can apply through this link.

Kaia Wave
If you'd like support from the Kaia Wave team along with your Mini Dapp, please submit both the SDK Terms & Conditions and the Kaia Wave application form.

Go to page to submit SDK T&C and Kaia Wave >

2. 🧪 Develop Mini Dapp Demo
Please develop your Mini Dapp according to the provided checklist. 

For any technical questions during development, feel free to contact us through the Telegram Tech Support Channel or via email at minidapp_review@dappportal.io.

3. 🧾 Review & Feedback
Demo Submission
Please submit a testable demo for review.
When submitting your demo, please include the following information:

Submission email address: minidapp_review@dappportal.io

LINE(LIFF) / Web Version URL

Desired launch date

Review & Feedback
Your submission will be reviewed and feedback will be provided within 3 business days.

4. 🤝 Onboarding Coordination
Once your demo is approved, the onboarding process for official launch will begin.
A dedicated BD(Business Development) manager will be assigned, and you will receive onboarding guidance and next steps through them.

5. 🚀 Launching Mini Dapp
Once onboarding is complete, your Mini Dapp will be scheduled for official launch.
We will coordinate with your team to finalize the launch date and ensure all technical and operational checks are complete.

Key launch steps include:

Publishing the Mini Dapp on the Dapp Portal with live LINE(LIFF) / Web Version URL

Optional promotions via reward events

Post-launch monitoring support for stability and performance

Please be ready to respond to any urgent issues during launch week. Our team will be available to support you throughout the process.
Mini Dapp
How to build Mini Dapp?

You can check the development scope required for implementing Mini Dapps in the diagram above.

LIFF version of the Mini Dapp must be implemented through LINE Developers. More details can be found in the LINE Integration menu.

The Mini Dapp SDK supports wallet integration and payment functionality. The wallet that connects may vary depending on the LIFF and web versions. Mini Dapps can sell in-app items through the payment feature.

Additionally, if you register your information through a separate track, you may be featured on the Dapp Portal and also sell NFTs.
Sample Mini Dapp
Explorer Various Mini Dapps from Dapp Portal
LINE Version : https://liff.line.me/2006533014-8gD06D64

Web Version : https://dappportal.io 

Please open the link on LINE Messenger App from Mobile

Mini Dapp Demo
Please refer to below Mini Dapp Demo to build your Mini Dapp.

LINE Version: https://liff.line.me/2006880697-nWPg5LpZ

Web Version: https://minidapp-demo.dappportal.io/

Previous
Overview

