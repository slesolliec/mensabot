<template>
  <div>

	<Header />


    <main>
      <Nuxt />
    </main>


  </div>
</template>

<style>

html {
	  background: #DDDDDD;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}



*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}


main {
	width: 760px;
	margin-left: auto;
	margin-right: auto;
	padding: 16px 8px 4px 16px;
}


input::placeholder {
    color: #AAA;
}


/* for mobiles (small screens) */
@media screen and (max-width: 480px) {}

</style>
