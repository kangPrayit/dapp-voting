import Web3 from "web3"; // Saat kode ini dibuat menggunakan web3 0.20.3
import votingArtifact from "../../build/contracts/Voting.json";

let candidates = {};
let pricePerToken;

const App = {
  web3: null,
  account: null,
  voting: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = votingArtifact.networks[networkId];
      this.voting = new web3.eth.Contract(
        votingArtifact.abi,
        deployedNetwork.address
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      this.embuh();

      // this.refreshBalance();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  embuh: async function() {
    const { totalVotesFor, allCandidates } = this.voting.methods;
    var count = await totalVotesFor(this.web3.utils.asciiToHex(name)).call();
    // console.log(count);

    var candidates = await allCandidates().call();
    // console.log(candidates);

    await this.loadCandidates();
    // this.setupCandidateRows();
    // let candidateNames = Object.keys(candidates);
    // console.log(candidateNames);
    // for (var i = 0; i < candidateNames.length; i++) {
    //   let name = candidateNames[i];
    //   var count = await totalVotesFor(this.web3.utils.asciiToHex(name)).call();
    //   $("#" + candidateNames[name]).html(count);
    // }
  },

  loadCandidates: async function() {
    const {
      totalVotesFor,
      allCandidates,
      totalTokens,
      tokensSold,
      tokenPrice
    } = this.voting.methods;
    let candidatesArray = await allCandidates().call();
    for (let i = 0; i < candidatesArray.length; i++) {
      candidates[this.web3.utils.hexToUtf8(candidatesArray[i])] =
        "candidate-" + i;
    }
    Object.keys(candidates).forEach(function(candidate) {
      $("#candidate-rows").append(
        "<tr><td>" +
          candidate +
          "</td><td id='" +
          candidates[candidate] +
          "'></td></tr>"
      );
    });

    let candidateNames = Object.keys(candidates);
    for (var i = 0; i < candidateNames.length; i++) {
      let name = candidateNames[i];
      var count = await totalVotesFor(this.web3.utils.asciiToHex(name)).call();
      $("#" + candidates[name]).html(count);
    }

    let value = await totalTokens().call();
    $("#tokens-total").html(value.toString());

    value = await tokensSold().call();
    $("#tokens-sold").html(value.toString());

    value = await tokenPrice().call();
    // console.log(web3.fromWei(value.toString()));
    pricePerToken = web3.fromWei(value.toString());
    $("#token-cost").html(pricePerToken + " Ether");

    // Voting SmartContract "0xB6b1B6D9B349548e05247b91970dc8e2d30f567d"
    web3.eth.getBalance(this.voting.options.address, function(error, result) {
      $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
    });
  },

  setupCandidateRows: function() {
    console.log(candidates);
    Object.keys(candidates).forEach(function(candidate) {
      console.log(candidate);
      $("#candidate-rows").append(
        "<tr><td>" +
          candidate +
          "</td><td id='" +
          candidates[candidate] +
          "'></td></tr>"
      );
    });
  },

  buyTokens: async function() {
    const { buy, totalTokens, tokensSold, tokenPrice } = this.voting.methods;

    let tokensToBuy = parseInt($("#buy").val());
    let price = tokensToBuy * parseInt(web3.toWei(pricePerToken));

    $("#buy-msg").html("Purchase order has been submitted. Please wait.");
    await buy().send({ gas: 140000, value: price, from: this.account });
    $("#buy-msg").html("");
    $("#buy").val("");

    let value = await totalTokens().call();
    $("#tokens-total").html(value.toString());

    value = await tokensSold().call();
    $("#tokens-sold").html(value.toString());

    value = await tokenPrice().call();
    // console.log(web3.fromWei(value.toString()));
    pricePerToken = web3.fromWei(value.toString());
    $("#token-cost").html(pricePerToken + " Ether");

    web3.eth.getBalance(this.voting.options.address, function(error, result) {
      $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
    });
    // await this.populateTokenData();
  },

  voteForCandidate: async function() {
    let candidateName = $("#candidate").val();
    let voteTokens = $("#vote-tokens").val();
    $("#msg").html(
      "Vote has been submitted. The vote count will increment as soon as the vote is recorded on the blockchain. Please wait."
    );
    $("#candidate").val("");
    $("#vote-tokens").val("");

    const { totalVotesFor, voteForCandidate } = this.voting.methods;
    await voteForCandidate(
      this.web3.utils.asciiToHex(candidateName),
      voteTokens
    ).send({
      gas: 140000,
      from: this.account
    });

    let div_id = candidates[candidateName];
    var count = await totalVotesFor(
      this.web3.utils.asciiToHex(candidateName)
    ).call();
    $("#" + div_id).html(count);
    $("#msg").html("");
  }
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live"
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:9545")
    );
  }

  App.start();
});
