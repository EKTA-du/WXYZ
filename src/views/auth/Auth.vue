<template>
  <div class="vertical-center">
    <div class="form-container">
      <div class="header">
        <div class="logo">Satellite &nbsp;&nbsp; Tracker</div>
      </div>
      <br />
      <div class="main-container">
        <transition name="fade">
          <form id="form1" v-show="form1Visible">
            <div class="form-floating">
              <input type="email" class="form-control" id="SigninEmail" placeholder="name@example.com">
              <label for="SigninEmail">Email address</label>
            </div>
            <div class="form-floating">
              <input type="password" class="form-control" id="SigninPassword" placeholder="Password">
              <label for="SigninPassword">Password</label>
            </div>
            <div class="buttons-container">
              <button type="submit" class="btn btn-primary" @click.prevent="LogIn">Login</button>
              <div id="option1" @click="toggleForms">SignUp Instead?</div>
            </div>
          </form>
        </transition>
        <transition name="fade">
          <form id="form2" v-show="form2Visible">
            <div class="form-floating">
              <input type="text" class="form-control" id="SignupName" placeholder="FullName">
              <label for="SignupName">Full Name</label>
            </div>
            <div class="form-floating">
              <input type="email" class="form-control" id="SignupEmail" placeholder="name@example.com">
              <label for="SignupEmail">Email address</label>
            </div>
            <div class="form-floating">
              <input type="password" class="form-control" id="SignupPassword" placeholder="Password">
              <label for="SignupPassword">Password</label>
            </div>
            <div class="form-floating">
              <input type="password" class="form-control" id="SignupConfirmPassword" placeholder="ConfirmPassword">
              <label for="SignupConfirmPassword">Confirm Password</label>
            </div>
            <div class="buttons-container">
              <button type="submit" class="btn btn-primary" @click.prevent="SignUp">SignUp</button>
              <div id="option2" @click="toggleForms">SignIn Instead?</div>
            </div>
          </form>
        </transition>
      </div>
      <div class="footer">
        <p> Created By:</p>
        <p> Danish Manzoor - 1AM21CS040 <br />Edwin Wilson Fernandes - 1AM21CS053<br /> Ekta Kumari - 1AM21CS054<br />
          Christina S - 1AM21CS038</p>
      </div>
    </div>
    <div class="content">
      <div ref="content"></div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { userSignup, userLogin } from '../../http/index';

export default {
  data() {
    return {
      form1Visible: true,
      form2Visible: false,
    };
  },
  mounted() {
    const loader = new GLTFLoader();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    let model;
    renderer.setSize(800, 500);
    this.$refs.content.appendChild(renderer.domElement);

    camera.position.z = 5;

    loader.load("src/models/ISS_stationary.glb", (gltf) => {
      model = gltf.scene;

      const scaleFactor = 0.045;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      scene.add(model);

      const ambientLight = new THREE.AmbientLight(0x00000, 1);
      scene.add(ambientLight)


      const pointLight = new THREE.PointLight(0xffffff, 1.8, 100);
      pointLight.position.set(25, 50, 5);
      scene.add(pointLight);

      const directionalLight = new THREE.DirectionalLight(0xfffff, 0.3);
      directionalLight.position.copy(camera.position);
      scene.add(directionalLight);
    });
    function animate() {
      requestAnimationFrame(animate);

      if (model)
        model.rotation.y += 0.003;

      renderer.render(scene, camera);
    }

    animate();
  },
  methods: {
    toggleForms() {
      if (this.form1Visible) {
        this.form1Visible = false;
        setTimeout(() => {
          this.form2Visible = true;
        }, 500);
      } else {
        this.form2Visible = false;
        setTimeout(() => {
          this.form1Visible = true;
        }, 500);
      }
    },
    SignUp() {
      const name = document.getElementById('SignupName').value;
      const email = document.getElementById('SignupEmail').value;
      const password = document.getElementById('SignupPassword').value;
      const confirmPassword = document.getElementById('SignupConfirmPassword').value;

      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      userSignup({ name, email, password })
        .then((res) => {
          alert('User Created Successfully');
          this.toggleForms();
        })
        .catch((err) => {
          alert('User Already Exists');
        });
    },
    LogIn() {
      const email = document.getElementById('SigninEmail').value;
      const password = document.getElementById('SigninPassword').value;
      userLogin({ email, password })
        .then((res) => {
          localStorage.setItem('authToken', res.token);
          this.$router.push('/');
        })
        .catch((err) => {
          console.log(err);
          alert('Invalid Credentials');
        });
    },
  },
};
</script>

<style scoped src="../../assets/Auth.css"></style>