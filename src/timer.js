import React from 'react';
import './main.css';
import PropTypes from 'prop-types';

/**
 * The timer component
 */
class Timer extends React.Component {
  /**
   * Creates a new Timer element
   * @param {object} props React props
   * @param {Function} [props.onTick] Called when timer updates with current state
   * @param {string} [props.name] Name of the timer
   */
  constructor(props) {
    super(props);
    let storageName = 'timerState';
    if (props.name) storageName += ':' + props.name;
    this.storageName = storageName;
    let loadedState = this.loadState(storageName);
    if (!loadedState) loadedState = {};
    this.state = Object.assign({}, {
      started: false, // has the timer been started?
      paused: false, // is the timer currently paused?
      ended: false, // has the timer reached the end?
      endTime: null, // unix time when timer ends
      pauseRemaining: null, // time remaining when the timer was paused
      display: this._formatTime(0, 0, 0), // text to display
      hours: 0, // amount of time set by input
      minutes: 0,
      seconds: 0,
      lastOffset: 0, // last offset of the timer loop
      name: props.name || null, // custom name assigned to timer

      input_hours: '', // string values used in input fields
      input_minutes: '',
      input_seconds: ''
    }, loadedState, {
      input_name: props.name || ''
    });
    this.timeout = null;
    if (this.state.started && !(this.state.ended || this.state.paused)) {
      setImmediate(() => this.update()); // the component is currently mounting
    }
  }
  /**
   * Load the state from local storage
   * @param {string} storageName Name of localstorage entry
   * @return {object} Loaded state
   */
  loadState(storageName) {
    let state = localStorage.getItem(storageName);
    if (!state) return null;
    try {
      state = JSON.parse(state);
    } catch (err) {
      return null;
    }
    return state;
  }
  /** React componentDidUpdate hook */
  componentDidUpdate() {
    try {
      localStorage.setItem(this.storageName, JSON.stringify(this.state));
    } catch (e) {/* ignore */}
    if (this.props.onTick) this.props.onTick(this.state);
  }
  /**
   * Converts milliseconds to hours/minutes/seconds
   * @param {number} ms Milliseconds to convert
   * @return {number[]} Hours, minutes, seconds
   */
  _msToHms(ms) {
    let totalSecs = Math.ceil(ms / 1000);
    let hours = Math.floor(totalSecs / 60 / 60);
    let minutes = Math.floor(totalSecs / 60) % 60;
    let seconds = totalSecs % 60;
    return [hours, minutes, seconds];
  }
  /**
   * Converts hours/minutes/seconds to milliseconds
   * @param {number} hours Hours
   * @param {number} minutes Minutes
   * @param {number} seconds Seconds
   * @return {number} Milliseconds
   */
  _hmsToMs(hours, minutes, seconds) {
    return Math.max(hours * 1000 * 60 * 60 +
    minutes * 1000 * 60 +
    seconds * 1000, 0);
  }
  /**
   * Update the timer display
   */
  update() {
    this.setState(prevState => {
      let remaining = prevState.endTime - Date.now();
      if (remaining > 0) {
        let offset = remaining % 1000;
        this.timeout = setTimeout(() => this.update(), offset);
        let totalSecs = Math.ceil(remaining / 1000);
        let hours = Math.floor(totalSecs / 60 / 60);
        let minutes = Math.floor(totalSecs / 60) % 60;
        let seconds = totalSecs % 60;
        return {
          display: this._formatTime(hours, minutes, seconds),
          lastOffset: (remaining % 1000) - 1000
        };
      } else {
        return {
          ended: true,
          display: this._formatTime(0, 0, 0)
        };
      }
    });
  }
  /**
   * Start the timer
   */
  start() {
    if (this.state.started) this.reset();
    this.setState({
      endTime: Date.now() + this._hmsToMs(this.state.hours, this.state.minutes,
        this.state.seconds),
      started: true,
      paused: false
    });
    this.update();
  }
  /**
   * Pause the timer
   */
  pause() {
    if (!this.state.started) return;
    clearTimeout(this.timeout);
    this.setState(prevState => ({
      paused: true,
      pauseRemaining: prevState.endTime - Date.now()
    }));
  }
  /**
   * Unpause the timer
   */
  unpause() {
    this.setState(prevState => ({
      paused: false,
      pauseRemaining: null,
      endTime: Date.now() + prevState.pauseRemaining
    }));
    this.update();
  }
  /**
   * Reset the timer
   */
  reset() {
    clearTimeout(this.timeout);
    this.setState({
      started: false,
      paused: false,
      ended: false,
      endTime: null,
      pauseRemaining: null,
      display: this._formatTime(0, 0, 0)
    });
  }
  /**
   * Prettify a digit for the timer
   * @param {number|string} num Value to prettify
   * @return {string} The prettified digit
   */
  _prettyDigit(num) {
    return (+num).toString().padStart(2, '0');
  }
  /**
   * Return a formatted time string
   * @param {number} hours Hours
   * @param {number} minutes Minutes
   * @param {number} seconds Seconds
   * @return {string} The time string
   */
  _formatTime(hours, minutes, seconds) {
    return `${this._prettyDigit(hours)}:` +
      `${this._prettyDigit(minutes)}:` +
      `${this._prettyDigit(seconds)}`;
  }
  /**
   * Handles changes in form inputs
   * @param {Event} event The event to be handled
   */
  handleTimeInputChange(event) {
    this.setState({
      [event.target.name]: +event.target.value,
      ['input_' + event.target.name]: event.target.value
    });
  }
  /** Handles when form input loses focus */
  handleTimeInputBlur() {
    this.setState(prevState => {
      let [hours, minutes, seconds] = this._msToHms(this._hmsToMs(
        prevState.hours, prevState.minutes, prevState.seconds));
      return {
        hours,
        minutes,
        seconds,
        input_hours: this._prettyDigit(hours),
        input_minutes: this._prettyDigit(minutes),
        input_seconds: this._prettyDigit(seconds)
      };
    });
  }
  /**
   * Handles when enter key is pressed in time input
   * @param {Event} event
   */
  handleTimeInputEnter(event) {
    if (event.key === 'Enter') {
      this.handleTimeInputBlur();
      this.start();
    }
  }
  /** Handles setting the name of the timer */
  handleSetName() {
    let name = this.state.input_name;
    if (name === '') name = null;
    if (name === this.state.name) return;
    let storageName = 'timerState';
    if (name) storageName += ':' + name;
    this.storageName = storageName;
    let loadedState = this.loadState(storageName);
    if (loadedState) {
      this.setState(prevState => {
        let newState = Object.assign(loadedState, {
          input_name: prevState.input_name
        });
        // recreate timeout
        clearTimeout(this.timeout);
        if (newState.started && !(newState.ended || newState.paused)) {
          setImmediate(() => this.update());
        }
        return newState;
      });
    } else this.setState({ name });
  }
  /** Reset the input fields */
  resetInput() {
    this.setState({
      input_hours: '',
      input_minutes: '',
      input_seconds: '',
      hours: 0,
      minutes: 0,
      seconds: 0
    });
  }
  /** Clear all saved timers */
  clearAllTimers() {
    localStorage.clear();
    this.setState({
      name: null,
      input_name: ''
    });
    this.storageName = 'timerState';
  }
  render() {
    return <div className='container'>
      <div className={'number' + (this.state.ended ?
        ' number-ended' : '') + (this.state.paused ?
        ' number-pause' : '')}>{this.state.display}</div>
      <br/>
      {['hours', 'minutes', 'seconds'].map(name =>
        <input
          name={name} key={name} type="number" placeholder={name} title={name}
          className="time" value={this.state['input_' + name]}
          onChange={this.handleTimeInputChange.bind(this)}
          onBlur={this.handleTimeInputBlur.bind(this)}
          onKeyPress={this.handleTimeInputEnter.bind(this)}
        />
      )}
      <button
        onClick={this.resetInput.bind(this)}
        title="Clear time input fields"
      >Clear</button>
      <br/>
      <input
        name="name" type="text" placeholder="timer name"
        size="15" title="Create or load a timer with given name"
        value={this.state.input_name}
        onChange={event => this.setState({ input_name: event.target.value })}
        onBlur={this.handleSetName.bind(this)}
        onKeyPress={event => {
          if (event.key === 'Enter') this.handleSetName();
        }}
      />
      <br/><br/>
      <button onClick={this.start.bind(this)}>Start</button>
      {this.state.paused ?
        <button onClick={this.unpause.bind(this)}>Unpause</button> :
        <button onClick={this.pause.bind(this)}>Pause</button>}
      <button onClick={this.reset.bind(this)}>Reset</button>
      <br/><br/>
      <button
        onClick={this.clearAllTimers.bind(this)}
        style={{ width: '170px' }}
        title="Clear all saved timers"
      >Clear saved timers</button>
    </div>;
  }
}
Timer.propTypes = {
  onTick: PropTypes.func,
  name: PropTypes.string
};

export default Timer;
