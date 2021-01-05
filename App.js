import React, { useState } from 'react';
 import storage from '@react-native-firebase/storage';

import {
  Button,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImgToBase64 from 'react-native-image-base64';

const MyComponent = (ground) => { 
  return (
    <View style={styles.photoCnt}>
      <Image
        source={{
          uri: ground.foto,
        }}
        style={styles.photo}
        resizeMode="stretch"
      />
      {ground.kordi.map((prop, id) => {
        return (
          <View
            key={prop.id}
            style={[
              styles.kare,
              {
                top: prop.top,
                bottom: prop.bottom,
                left: prop.left,
                right: prop.right,
              },
            ]}
          />
        );
      })}
    </View>
  );
};


const konumlar = [];
const App = () => {
  const [responseKontrol, responseKontrolSet] = useState(false);
  const [base64str, base64strSet] = useState('');
  const [foto, fotoSet] = useState();

  function kamerayiAc() {
    const options = {};
    launchCamera(options, async (callback) => { 
      ImgToBase64.getBase64String(callback.uri).then((base64String) => { 
        base64strSet(base64String); 
      });
    });
  }

  function galeriAc() {
    const options = {};
    launchImageLibrary(options, async (callback) => {
      fotoSet(callback.uri);
      ImgToBase64.getBase64String(callback.uri).then((base64String) => {
        base64strSet(base64String);
      });
    });
  }
  async function gvision() {
     let fotoname=foto.substring(foto.lastIndexOf('/') + 1)
     storage()
      .ref(fotoname)
       .putFile(foto)   
       .catch((e) => console.log('uploading image error => ', e));

    let googleVisionRes = await fetch(
      'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCWEbqanaSg3xFfnts7VS4bvmotXW3SgTA',
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64str,
              },
              features: [{ type: 'OBJECT_LOCALIZATION', maxResults: 20 }],// max nesne tanıma sayısı:20 featuresden OBJECT_LOCALIZATION kullnaıyoruz
            },
          ],
        }),
      },
    );

    await googleVisionRes
      .json()
      .then((googleVisionRes) => {
        console.log(googleVisionRes)
        let x = googleVisionRes.responses[0].localizedObjectAnnotations;
        for (var i = 0; i < googleVisionRes.responses[0].localizedObjectAnnotations.length; i++) {
          let konum = konumBul(x[i].boundingPoly.normalizedVertices);
          konumlar.push(konum);
          konumlar[i].id = i;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    responseKontrolSet(true);
  }

  function konumBul(dizi) {
    let konum = { top: 0.0, bottom: 1.0, left: 1.0, right: 0.0 };

    for (let i = 0; i < dizi.length; i++) {
      if (dizi[i].y != null) {
        if (dizi[i].y > konum.top) konum.top = dizi[i].y;
        if (dizi[i].y < konum.bottom) konum.bottom = dizi[i].y;
      }
      if (dizi[i].x != null) {
        if (dizi[i].x < konum.left) konum.left = dizi[i].x;
        if (dizi[i].x > konum.right) konum.right = dizi[i].x;
      }
    }
    let ilkTop = konum.top;
    konum.top = 300 * konum.bottom;
    konum.bottom = 300 - 300 * ilkTop;
    konum.left = 300 * konum.left;
    konum.right = 300 - 300 * konum.right;


    return konum;
  }
  return (
    <ImageBackground source={require('./src/image.jpg')} style={styles.back}>
      <View style={styles.container}>
        <View style={{ height: 50, width: 350, margin: 5 }}>
          <Button title="Kamera" style={{ margin: 10 }} onPress={kamerayiAc}></Button>
        </View>
        <View style={{ height: 50, width: 300, marginBottom: 50 }}>
          <Button title="Galeri " style={{ margin: 10 }} onPress={galeriAc}></Button>
        </View>
        
        <View style={{ height: 50, width: 250, margin: 5 }}>
          <Button title="google Cloud Vision" onPress={gvision}></Button>
          {responseKontrol && <MyComponent foto={foto} kordi={konumlar} />}
        </View>
        <Text style={styles.text}>ÇIKTI={konumlar.length}</Text>
      </View>
      
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    marginTop: 15,
  },
  photo: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    
  },
  text: {
    color: 'white',
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#000000a0',
    fontWeight: 'bold',
    margin: 300 ,
    height: 50, 
    width: 200,
  },
  photoCnt: {
    width: 300,
    height: 300,
    alignSelf: 'center',
  },
  photo: {
    width: 300,
    height: 300,
  },
  kare: {
    borderWidth: 3,
    borderColor: 'pink',
    position: 'absolute',
  },
  back:
  {
    flex: 1,
    height: '100%',
    width: '100%',
  }
});

export default App;
