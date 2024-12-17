import { NextResponse, type NextRequest } from "next/server";

import {
	getSellTradesByWalletAddress,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { walletAddress } = body;

  console.log("walletAddress", walletAddress);
  

  const result = await getSellTradesByWalletAddress({
    walletAddress: walletAddress,
    limit: 200,
    page: 1,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}