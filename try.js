async function trying() {
   let i = 0
   for (i = 0; i < 1000000; i++) {
       i++;
   }
   setTimeout(() => {
      console.log(i);
   }, 2000);
}
async function show() {
   console.log(" i am good ");
}
async function main() {
   trying();
   show();
}
main()
