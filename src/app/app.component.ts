import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { interval, Observable, Subscription, timer } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Temperature {
  current: number;
  desired:number;
  }

export interface AC {
  working:boolean;
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'iot';

  outsideTemp:number = 10;

  defTemp:Temperature = {
    current:10,
    desired:20
  }

  private tempDoc: AngularFirestoreDocument<Temperature>;
  tempObservable: Observable<Temperature | undefined>;
  temp:Temperature | null= null;
  desiredTemp!:number | null;

  private ACDoc: AngularFirestoreDocument<AC>;
  ACObservable: Observable<AC | undefined>;
  ACWorking!: boolean;

  timerSubscription: Subscription; 

  constructor(private afs: AngularFirestore) {
    afs.collection<Temperature>('temperature').doc('1').get().toPromise().then(d => {
      if(!d.exists)
        afs.collection<Temperature>('temperature').doc('1').set(this.defTemp);
    });
    this.tempDoc = afs.collection<Temperature>('temperature').doc("1");
    this.ACDoc = afs.collection<Temperature>('AC').doc("1");

    this.tempObservable = this.tempDoc.valueChanges();
    this.ACObservable = this.ACDoc.valueChanges();

    this.timerSubscription = timer(0, 300).pipe( 
      map(() => { 
        this.checkIfACWorking(); 
      }) 
    ).subscribe(); 
  }

  ngOnInit(): void {
      this.tempObservable.subscribe(t => {
        if(t)
          this.temp =t;
      })

      this.ACObservable.subscribe(t => {
        if(t)
          this.ACWorking =t.working;
      })

      this.checkIfACWorking();
  }

  changeDesiredTemp() {
    if(this.desiredTemp)
    {
      this.temp!.desired = this.desiredTemp;
      this.afs.collection<Temperature>('temperature').doc('1').update(this.temp!);
    }
    this.desiredTemp = null;
  }

  turnOnAC () {
    this.afs.collection<AC>('AC').doc("1").set({working:true});
  }

  turnOffAC () {
    this.afs.collection<AC>('AC').doc("1").set({working:false});
  }

  checkIfACWorking(){
    if(this.ACWorking)
       this.controlRoomTempWithAC();
    else
      this.controlRoomTempWithoutAC();
  }

  controlRoomTempWithAC() {
    if(this.temp)
    {
      if(this.temp.desired < this.temp.current) {
        this.temp.current--;
      }
      if(this.temp.desired > this.temp.current){
        this.temp.current++;
      }
     this.afs.collection<Temperature>('temperature').doc('1').update(this.temp!);
    }
  }

  controlRoomTempWithoutAC() {
    if(this.temp)
    {
      if(this.temp.current < this.outsideTemp) {
        this.temp.current++;
      }
      if(this.temp.current > this.outsideTemp){
        this.temp.current--;
      }
     this.afs.collection<Temperature>('temperature').doc('1').update(this.temp!);
    }
  }



}
