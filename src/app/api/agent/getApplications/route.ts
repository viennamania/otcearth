import { NextResponse, type NextRequest } from "next/server";



import {
	getAllAgentsForAILabs,
} from '@lib/api/agent';
import { stat } from "fs";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { walletAddress } = body;


  
  if (!walletAddress) {

    return NextResponse.error();

  }
  
  //console.log("walletAddress", walletAddress);

  if (
      

      walletAddress === "0x0d2846FDbaAc5e9526f9409aE18d3e2c9CdC9466" // wayne

      || walletAddress === "0xBB5af298798539303eA929Fc68De4F2341A5c12B" // kwak



      // AI Labs
      || walletAddress === "0x8b633C7273a373F04B1C167dd0781cd38c7EBAc8" // 허태인 
      || walletAddress === "0xc05F8B05C1EC24AdB332B31c5A479EA6EC7A78BD" // 차보형 과장
      
    
    ) {

      
      const result = await getAllAgentsForAILabs({
        limit: 200,
        page: 1,
      });
      

 
      return NextResponse.json({
        status: "success",
        result: result,
      });


  } else {

    return NextResponse.error();
    

  }


  
}
