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
	  background: #eeeeee;
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

h1, h2, h3, h4, h5, h6 {
  margin-top: 10px;
}

p {
  margin-bottom: 10px;
}

h1 {  font-size: 24px; }
h2 {  font-size: 18px; }
h3 {  font-size: 16px; }
h4 {  font-size: 14px; }



main {
	width: 760px;
	margin-left: auto;
	margin-right: auto;
	padding: 16px 8px 4px 16px;
}


input::placeholder {
    color: #AAA;
}

table.list th, table.list td {
  padding: 4px;
}

table.list th {
  background: #CCC;
  text-align: left;
}

table.list tbody tr:nth-child(odd) {
  background: #FFF;
}


/* for mobiles (small screens) */
@media screen and (max-width: 480px) {}

</style>
