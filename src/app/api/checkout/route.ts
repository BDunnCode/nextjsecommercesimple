import { NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// Get the products from within stripe that are currently marked active

const getActiveProducts = async () => {
  const checkProducts = await stripe.products.list();
  const availableProducts = checkProducts.data.filter((product: any) => product.active === true
  );
  return availableProducts;
}


// Create and post a new product to stripe

export const POST = async(request: any) => {
    const {products} = await request.json();
    const data: Product[] = products;


    // Use the above getActiveProducts function and store the results for later use. Has to use await because getActiveProducts is an async function.
    // getActiveProducts is an async function because it's getting something from a server / API so basically always going to be async in that situation.
    let activeProducts = await getActiveProducts();

    try {
      // for of loop to check if the product that we're trying to add already exists inside of the stripe database
      for (const product of data) {
          const stripeProduct = activeProducts?.find(
            (stripeProduct: any) => 
            stripeProduct?.name?.toLowerCase() == product?.name?.toLowerCase()
          )

      // If that doesn't item / product doesn't exist in the database, 
      // it will return undefined, in which case we'll create it using stripe methods.
          if(stripeProduct == undefined) {
            const prod = await stripe.products.create({
              name: product.name,
              default_price_data: {
                unit_amount: product.price * 100,
                currency: 'usd',
              }
            })
          }
      }
    } catch (error) {
      console.error("Error in creating a new product");
      throw error;
    }

    // Uses the same for of loop logic that was used to check if items exist before,
    // but instead of following up that check with creating an item, it's for the purpose of
    //

    activeProducts = await getActiveProducts();
      let stripeItems: any = [];

      for (const product of data) {
        const stripeProduct = activeProducts?.find(
          (prod: any) => 
          prod?.name?.toLowerCase() == product?.name?.toLowerCase()
        );

        if(stripeProduct) {
          stripeItems.push({
            price: stripeProduct?.default_price,
            quantity: product?.quantity,
          });
        }
      }

      const session = await stripe.checkout.sessions.create({
        line_items: stripeItems,
        mode: "payment",
        success_url: "https://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel"
      })
    
      return NextResponse.json({ url: session.url });
}

