import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
  getOneByOrderId,
	requestPayment,

} from '@lib/api/order';

import { getOneByWalletAddress } from '@lib/api/user';


// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";


import { TronWeb, utils as TronWebUtils, Trx, TransactionBuilder, Contract, Event, Plugin } from 'tronweb';




export async function POST(request: NextRequest) {

  const body = await request.json();

  const {orderId } = body;

  console.log("orderId", orderId);
  

  const order = await getOneByOrderId(orderId);

  if (!order) {
    return NextResponse.json({
      error: "order not found",
    });
  }


  const user = await getOneByWalletAddress(order.walletAddress);



  const fromWalletAddress = user?.tronWalletAddress;
  const tronWalletPrivateKey = user?.tronWalletPrivateKey;


  const toWalletAddress = user?.tronEscrowWalletAddress;
  const usdtAmount = order.usdtAmount;


  console.log("fromWalletAddress", fromWalletAddress);
  console.log("tronWalletPrivateKey", tronWalletPrivateKey);


  // USDT contract address
  const contractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';


  const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: {
      'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY,
    },
    privateKey: tronWalletPrivateKey,
  });




  const tx = await tronWeb.transactionBuilder.triggerSmartContract(
    //"TRC-20 Contract Address according to network you use",
    //'transfer(address,uint256)',

    contractAddress,
    'transfer(address,uint256)',
    {
      
      //feeLimit: 10000000,
      feeLimit: 1e9,

      callValue: 0
    },
    [
      {
        type: 'address',
        value: toWalletAddress
      },
      {
        type: 'uint256',
        value: usdtAmount * 1000000
      }
    ],
    tronWeb.address.toHex(fromWalletAddress || "")
  );

  const signedTx = await tronWeb.trx.sign(tx.transaction);

  const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);

  //console.log("broadcastTx", broadcastTx);
  /*
  broadcastTx {
    code: 'BANDWITH_ERROR',
    txid: 'f4a9798ab41524a5b9c5febe030027e3099a12e194b3508498f94f178752011b',
    message: '4163636f756e74207265736f7572636520696e73756666696369656e74206572726f722e',
    transaction: {
      visible: false,
      txID: 'f4a9798ab41524a5b9c5febe030027e3099a12e194b3508498f94f178752011b',
      raw_data: {
        contract: [Array],
        ref_block_bytes: 'fecf',
        ref_block_hash: '66833491695f8213',
        expiration: 1734532377000,
        fee_limit: 1000000000,
        timestamp: 1734532319517
      },
      raw_data_hex: '0a02fecf220866833491695f821340a8d3bed1bd325aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a15419eb64c0da8b9e8386c20912a20687e12cf71393d121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb000000000000000000000000de859c29f8ca8eb8d93acfd7213b0a2ef8fbed9e00000000000000000000000000000000000000000000000000000000002dc6c0709d92bbd1bd3290018094ebdc03',
      signature: [
        '3b56947670382bd09e4b54d05a7c51102e3b5ef6d82c4685cbb0a39f2f9d5c0d5f5fc5c47aa77805f75bca5a28ba9de39ab100122d3a1c513ceee1e9aba6980b1B'
      ]
    }
  }
  */

  if (broadcastTx && String(broadcastTx.code) === 'BANDWITH_ERROR') {
    return NextResponse.json({
      result: null,
    });
  }

  if (!broadcastTx || !broadcastTx.transaction || !broadcastTx.transaction.txID) {
    return NextResponse.json({
      result: null,
    });
  }


  const transactionHash = broadcastTx.transaction.txID;



  const result = await requestPayment({
    orderId: orderId,
    transactionHash: transactionHash,
  });


  //console.log("result", JSON.stringify(result));

  const {
    mobile: mobile,
    seller: seller,
    buyer: buyer,
    tradeId: tradeId,
    krwAmount: krwAmount,
  } = result as UserProps;


  const bankName = seller.bankInfo.bankName;
  const accountNumber = seller.bankInfo.accountNumber;
  const accountHolder = seller.bankInfo.accountHolder;
  const depositName = tradeId;
  const amount = krwAmount;


    // send sms


    console.log("byuer.mobile", buyer.mobile);



    if (!buyer.mobile) {
      return NextResponse.json({
        result,
      });
    }

    // check buyer.mobile is prefixed with +
    if (!buyer.mobile.startsWith("+")) {
      return NextResponse.json({
        result,
      });
    }

    const to = buyer.mobile;




    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);



    let message = null;

    try {

      const msgBody = `[OTC] TID[${tradeId}] ${bankName} ${accountNumber} ${accountHolder} 입금자명:[${depositName}] ${amount}원`;

      message = await client.messages.create({
        ///body: "This is the ship that made the Kessel Run in fourteen parsecs?",
        body: msgBody,
        from: "+17622254217",
        to: to,
      });

      console.log(message.sid);

    } catch (e) {
        
      console.log("error", e);

    }


 
  return NextResponse.json({

    result,
    
  });
  
}
