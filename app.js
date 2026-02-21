const contractAddress = "0x5dBa06953eAEd7a469a1Ac7349b27D3d0Da05492";

const abi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "LandRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_landId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_location",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "_owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_deedCID",
				"type": "string"
			}
		],
		"name": "registerLand",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_landId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_landId",
				"type": "uint256"
			}
		],
		"name": "getLand",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_landId",
				"type": "uint256"
			}
		],
		"name": "getOwnershipHistory",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "lands",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "currentOwner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "deedCID",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registrar",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let web3;
let contract;
let currentAccount;

// CONNECT WALLET
async function connectWallet() {

    if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
    }

    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
    });

    currentAccount = accounts[0];

    web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(abi, contractAddress);

    document.getElementById("walletDisplay").innerText =
        currentAccount.slice(0,6) + "..." + currentAccount.slice(-4);

    document.getElementById("connectButton").innerText = "✅ Connected";
    document.getElementById("connectButton").disabled = true;
}


// REGISTER LAND
async function processExcel() {

    if (!contract) {
        alert("Connect wallet first");
        return;
    }

    const file = document.getElementById("fileInput").files[0];
    if (!file) {
        alert("Select Excel file");
        return;
    }

    document.getElementById("loader").style.display = "block";

    const reader = new FileReader();

    reader.onload = async function(e) {

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type:"array"});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        try {
            for (let row of rows) {
                await contract.methods.registerLand(
                    row["Land ID"],
                    row["Location"],
                    row["Owner Wallet Address"],
                    row["Deed CID"]
                ).send({ from: currentAccount });
            }

            document.getElementById("registerStatus").innerHTML =
                "<span class='success'>Land Registered Successfully</span>";

        } catch (err) {
            document.getElementById("registerStatus").innerHTML =
                "<span class='error'>Transaction Failed</span>";
        }

        document.getElementById("loader").style.display = "none";
    };

    reader.readAsArrayBuffer(file);
}


// SEARCH LAND
async function searchLand() {

    if (!contract) {
        alert("Connect wallet first");
        return;
    }

    const id = document.getElementById("searchLandId").value;

    document.getElementById("searchLoader").style.display = "block";

    try {
        const land = await contract.methods.getLand(id).call();
        const history = await contract.methods.getOwnershipHistory(id).call();

        let historyHTML = "";
        history.forEach((owner, i) => {
            historyHTML += `<p>Owner ${i+1}: ${owner}</p>`;
        });

        document.getElementById("result").innerHTML = `
            <p><b>Location:</b> ${land[1]}</p>
            <p><b>Current Owner:</b> ${land[2]}</p>
            <p>
                <a href="https://gateway.pinata.cloud/ipfs/${land[3]}" target="_blank" style="color:#60a5fa;">
                View Deed
                </a>
            </p>
            <h4>Ownership History:</h4>
            ${historyHTML}
        `;

    } catch (err) {
        document.getElementById("result").innerHTML =
            "<span class='error'>Land Not Found</span>";
    }

    document.getElementById("searchLoader").style.display = "none";
}


// TRANSFER OWNERSHIP
async function transferLand() {

    if (!contract) {
        alert("Connect wallet first");
        return;
    }

    const id = document.getElementById("transferLandId").value;
    const newOwner = document.getElementById("newOwner").value;

    document.getElementById("transferLoader").style.display = "block";

    try {
        await contract.methods.transferOwnership(id, newOwner)
            .send({ from: currentAccount });

        document.getElementById("transferStatus").innerHTML =
            "<span class='success'>Ownership Transferred</span>";

    } catch (err) {
        document.getElementById("transferStatus").innerHTML =
            "<span class='error'>Transfer Failed</span>";
    }

    document.getElementById("transferLoader").style.display = "none";
}