# 🌾 CropCred — Blockchain + AWS based Crop Traceability & Credibility Platform

> Know your food. Trust your farmer.  
> Every crop batch becomes traceable and tamper-proof using Blockchain + QR + AWS DynamoDB.

---

## ✨ What CropCred Does

| Role        | What they can do |
|-------------|------------------|
| 👨‍🌾 Farmer  | Signup using OTP → Create crop batch → Upload docs → Add lifecycle events (harvest/storage/transport) |
| 🔗 Blockchain | Stores hash of each lifecycle event (immutability & trust) |
| 🧠 Backend   | Auth, storing events, credibility scoring, QR generation |
| 🛍️ Consumer | Scan QR → View timeline + credibility score |

---


## 🧠 Architecture
```
React Frontend → Express Backend → DynamoDB + S3
↓
Solidity Smart Contract (Hardhat)
```

---

## 📦 Monorepo Structure
```
CropCred/
├─ backend/ # Express API, OTP Auth, DynamoDB, Credibility Engine
├─ frontend/ # React + Vite, AuthContext, QR Verify Page
├─ blockchain/ # Solidity contracts + Hardhat deployment
├─ .env.example # Template for env variables
└─ package.json # Workspaces (root installs all)
```

---



# 🛠️ Setup Instructions (Run this on your laptop)

## 1️⃣ Clone the repo

```sh
git clone https://github.com/<your-username>/CropCred.git
cd CropCred
````

---

## 2️⃣ Install dependencies

At **project root**:

```sh
npm install
```

Because of workspaces, this installs frontend + backend + blockchain in one shot.

---

## 3️⃣ Environment Variables

### ✅ backend/.env

> ⚠️ Never commit real AWS keys or private keys to GitHub.

```
# ---- Server ----
PORT=5000
NODE_ENV=development
JWT_SECRET=mySuperSecret123

# ---- Chain (LOCAL HARDHAT) ----
ALCHEMY_URL=http://127.0.0.1:8545
CHAIN_ID=31337
PRIVATE_KEY=<your-hardhat-or-dev-wallet-pk>
CONTRACT_ADDRESS=<filled-after-deploy>

# ---- AWS ----
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=<your-aws-key>           # DO NOT COMMIT
AWS_SECRET_ACCESS_KEY=<your-aws-secret>    # DO NOT COMMIT
S3_BUCKET=cropcred-certificates

# ---- Dynamo (eu-north-1) ----
USERS_TABLE=CropCred_Users
OTPS_TABLE=CropCred_Otps
CERTIFICATES_TABLE=Certificates
LIFECYCLE_EVENTS_TABLE=LifecycleEvents
LIFECYCLE_EVENTS_GSI1=GSI1_CertificateIdCreatedAt

# ---- Credibility Weights ----
ALPHA=0.25
BETA=0.25
GAMMA=0.25
DELTA=0.25

# ---- Auth / CORS ----
OTP_TTL_SECONDS=300
CORS_ORIGINS=http://localhost:5173
```

---

### ✅ frontend/.env.local

```
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api

VITE_CONTRACT_ADDRESS=<same contract address as backend>
VITE_NETWORK=localhost

VITE_PUBLIC_VERIFY_PREFIX=/v
VITE_PUBLIC_BASE_URL=http://localhost:5173
```

---

### ✅ blockchain/.env

```
LOCAL_RPC_URL=http://127.0.0.1:8545
ALCHEMY_URL=<only if deploying to Amoy>
PRIVATE_KEY=<hardhat wallet PK or metamask test wallet>
```

---

### ✅ `.env.example` (root)

> This file is what gets pushed to GitHub — **NO SECRETS**.

```
# ---- Server ----
PORT=
NODE_ENV=
JWT_SECRET=

# ---- Chain ----
ALCHEMY_URL=
CHAIN_ID=
PRIVATE_KEY=
CONTRACT_ADDRESS=

# ---- AWS ----
AWS_REGION=
S3_BUCKET=

# ---- Dynamo ----
USERS_TABLE=
OTPS_TABLE=
CERTIFICATES_TABLE=
LIFECYCLE_EVENTS_TABLE=
LIFECYCLE_EVENTS_GSI1=

# ---- Credibility Weights ----
ALPHA=
BETA=
GAMMA=
DELTA=

# ---- Auth / CORS ----
OTP_TTL_SECONDS=
CORS_ORIGINS=
```

---

## 4️⃣ Start Local Blockchain (Hardhat)

Terminal 1:

```sh
npm run chain
```

---

## 5️⃣ Deploy Smart Contract + Sync ABI

Terminal 2:

```sh
npm run deploy:local
npm run sync:abi
```

✅ Deploys contract
✅ Generates ABI into backend
✅ Updates frontend with contract address

---

## 6️⃣ Start Backend

Terminal 3:

```sh
npm run backend
```

Backend → [http://localhost:5000](http://localhost:5000)

---

## 7️⃣ Start Frontend

Terminal 4:

```sh
npm run frontend
```

Frontend → [http://localhost:5173](http://localhost:5173)

---

# ✅ End-to-End Flow

### 👨‍🌾 Farmer Dashboard

1. Login using OTP → password
2. Create Certificate (crop batch)
3. Upload docs → stored in S3
4. Add lifecycle events (DynamoDB + blockchain hash)
5. Generate QR

### 🛍️ Consumer

Scan QR → `/v/batch/:batchId`

Shows:

* Timeline (events)
* Credibility score (E + C + D + S)

---

## ✅ Credibility Score Model

| Metric             | Based On                             |
| ------------------ | ------------------------------------ |
| Ethics (E)         | Violation events / policy acceptance |
| Docs (C)           | Valid docs / expiry / type           |
| Delivery (D)       | On-time checkpoint logging           |
| Sustainability (S) | GPS, pesticide, carbon metrics       |

> Final score = weighted (ALPHA/BETA/GAMMA/DELTA)

---

## 🧪 Test API (Postman)

Import into Postman:

```
backend/test/Postman_Collection.json
```

---

## 👥 Team Division (5-person Work Contribution)

| Person | Responsibility                              |
| ------ | ------------------------------------------- |
| A      | Smart contract + Blockchain deployment      |
| B      | Backend API + OTP Auth + Credibility engine |
| C      | React frontend UI + AuthContext + QR verify |
| D      | AWS DynamoDB + S3 + IAM policies            |
| E      | Documentation + GitHub + Presentation       |

---

## ⭐ Future Enhancements

* Marketplace to sell verified crops
* Mobile App for farmers
* AI crop disease prediction

---

Made with ❤️, stress, and way too much coffee.



---

